"""
XML Processing Module for Nested File References

This module provides functionality for processing XML documents that contain special
<file> nodes with embedded XML file references. It recursively copies XML structures
while expanding file references and merging their content into the destination document.

The module is designed to handle XML templates and configurations that reference
external XML files, commonly used in scientific workflow systems like CCP4i2.

Typical Usage Example:
    import xml.etree.ElementTree as ET
    from load_nested_xml import load_nested_xml

    # Load an XML file with embedded file references
    tree = ET.parse("input.xml")
    root = tree.getroot()

    # Process the XML, expanding file references and removing file nodes
    processed_root = load_nested_xml(root)

Key Features:
    - Removes <file> nodes while processing their referenced content
    - Merges content from referenced XML files into ccp4i2_body elements
    - Applies text overrides from simple nodes when values differ
    - Handles CCP4I2_TOP project references with relative path resolution
"""

import xml.etree.ElementTree as ET
import pathlib
import logging
from typing import Optional, Dict, List
from ccp4i2.core import CCP4File


logger = logging.getLogger(f"ccp4x:{__name__}")


def load_nested_xml(src: ET.Element, dest: Optional[ET.Element] = None) -> ET.Element:
    """
    Copy an etree element to another etree element with special handling for 'file' nodes.

    This is the main entry point for the XML processing system. It recursively copies
    XML structures while applying special processing for <file> nodes that contain
    references to external XML files.

    File nodes are processed for their embedded content but are not included in the
    final XML output. Instead, their referenced content is merged into appropriate
    locations in the destination document.

    Args:
        src (ET.Element): Source etree element to copy from. This can be any XML element,
            but typically represents the root of an XML document.
        dest (ET.Element, optional): Destination etree element to copy to. If None,
            creates a new empty element with the same tag as src. Defaults to None.

    Returns:
        ET.Element: The destination etree element with copied content. All <file> nodes
            will have been removed, and their referenced content will have been merged
            into the appropriate locations.

    Example:
        >>> import xml.etree.ElementTree as ET
        >>> root = ET.fromstring('<root><child>text</child><file>...</file></root>')
        >>> result = load_nested_xml(root)
        >>> # result will contain <child>text</child> but not the <file> element

    Note:
        This function modifies the destination element in-place and also returns it.
        The source element is not modified.
    """
    if dest is None:
        dest = ET.Element(src.tag)

    # Copy attributes
    dest.attrib.update(src.attrib)

    # Copy text content
    if src.text:
        dest.text = src.text

    # Copy tail content (text after the element)
    if src.tail:
        dest.tail = src.tail

    # Handle special case for 'file' nodes - process them but don't add to destination
    if src.tag == "file":
        _handle_file_node(src, dest)
        # Return dest without adding the file node itself
        return dest

    # Recursively copy all child elements (excluding file nodes)
    for child in src:
        if child.tag != "file":
            child_copy = ET.Element(child.tag)
            child_copy = load_nested_xml(child, child_copy)
            dest.append(child_copy)
        else:
            # Process file node but don't add it to destination
            _handle_file_node(child, dest)

    # After all processing is complete, apply text overrides from simple nodes
    _apply_text_overrides(src, dest)

    return dest


def _handle_file_node(file_node: ET.Element, dest_root: ET.Element) -> None:
    """
    Handle special processing for 'file' nodes with CI2XmlDataFile children.

    This function processes <file> nodes that contain CI2XmlDataFile elements, which
    specify references to external XML files. It extracts the file path information,
    loads the referenced XML file, and merges its content into the destination.

    The file node itself is NOT added to the destination - only its referenced content
    is processed and merged.

    Args:
        file_node (ET.Element): The <file> element to process. Expected to contain
            a CI2XmlDataFile child element with project, baseName, and relPath children.
        dest_root (ET.Element): The root destination element where ccp4i2_body children
            from the referenced file will be merged.

    Expected File Node Structure:
        <file>
            <CI2XmlDataFile>
                <project>CCP4I2_TOP</project>
                <relPath>pipelines/some_pipeline/script</relPath>
                <baseName>parameters.xml</baseName>
            </CI2XmlDataFile>
        </file>

    Note:
        Currently only supports project="CCP4I2_TOP". Other project values are ignored.
        The function logs status messages for debugging purposes.
    """
    # Find the CI2XmlDataFile child node
    ci2_xml_data_file = file_node.find("CI2XmlDataFile")
    if ci2_xml_data_file is None:
        logger.debug("File node does not contain CI2XmlDataFile child")
        return

    # Extract project, baseName, and relPath
    project_node = ci2_xml_data_file.find("project")
    base_name_node = ci2_xml_data_file.find("baseName")
    rel_path_node = ci2_xml_data_file.find("relPath")

    if project_node is None or base_name_node is None or rel_path_node is None:
        logger.debug(
            "CI2XmlDataFile missing required elements (project, baseName, or relPath)"
        )
        return

    # Get text values and strip whitespace
    project = project_node.text.strip() if project_node.text else ""
    base_name = base_name_node.text.strip() if base_name_node.text else ""
    rel_path = rel_path_node.text.strip() if rel_path_node.text else ""

    # Check if project is "CCP4I2_TOP"
    if project == "CCP4I2_TOP":
        # Construct the file path
        ccp4_file_parent = pathlib.Path(CCP4File.__file__).parent.parent
        file_path = ccp4_file_parent / rel_path / base_name

        logger.debug(
            f"Processing CCP4I2_TOP file path: {file_path} (file node will be removed)"
        )

        # Parse the XML file and merge ccp4i2_body children
        _parse_and_merge_xml_file(file_path, dest_root)
    else:
        logger.debug(f"Skipping file node with unsupported project: {project}")


def _parse_and_merge_xml_file(file_path: pathlib.Path, dest_root: ET.Element) -> None:
    """
    Parse an XML file and merge its ccp4i2_body children into the destination root.

    This function loads an external XML file, finds all ccp4i2_body elements within it,
    and recursively merges their children into the destination document's ccp4i2_body
    element. If no ccp4i2_body exists in the destination, one is created.

    Args:
        file_path (pathlib.Path): Path to the XML file to parse and merge.
        dest_root (ET.Element): The root destination element where ccp4i2_body
            children will be merged.

    Raises:
        ET.ParseError: If the XML file cannot be parsed due to syntax errors.
        FileNotFoundError: If the specified file does not exist.

    Note:
        This function logs detailed status messages for debugging.
        If the file doesn't exist or cannot be parsed, warnings/errors are logged but
        no exceptions are raised - the function fails gracefully.

    Processing Flow:
        1. Check if file exists
        2. Parse the XML file
        3. Find all ccp4i2_body elements in the parsed file
        4. Find or create ccp4i2_body in destination
        5. Recursively copy children using load_nested_xml (which handles nested files)
    """
    try:
        logger.debug(f"Attempting to parse XML file: {file_path}")

        # Check if file exists
        if not file_path.exists():
            logger.exception(f"File not found: {file_path}")
            return

        # Parse the XML file
        tree = ET.parse(file_path)
        parsed_root = tree.getroot()

        logger.debug(f"Successfully parsed XML. Root element: <{parsed_root.tag}>")

        # Find all ccp4i2_body nodes in the parsed XML
        ccp4i2_body_nodes = parsed_root.findall(".//ccp4i2_body")

        if not ccp4i2_body_nodes:
            logger.debug(f"No ccp4i2_body nodes found in {file_path}")
            return

        logger.debug(f"Found {len(ccp4i2_body_nodes)} ccp4i2_body node(s)")

        # Find or create ccp4i2_body in destination
        dest_ccp4i2_body = _find_or_create_ccp4i2_body(dest_root)

        # Merge children from all ccp4i2_body nodes
        total_merged = 0
        for i, body_node in enumerate(ccp4i2_body_nodes):
            children_count = len(list(body_node))
            logger.debug(
                f"Processing ccp4i2_body node {i+1} with {children_count} children"
            )

            # Copy all children of the ccp4i2_body node using our recursive function
            # This will also remove any nested file nodes while processing their content
            for child in body_node:
                child_copy = load_nested_xml(child)
                dest_ccp4i2_body.append(child_copy)
                total_merged += 1

        logger.debug(
            f"Successfully merged {total_merged} children into destination ccp4i2_body"
        )

    except ET.ParseError as e:
        logger.exception(f"Error parsing XML file {file_path}: {e}")
    except FileNotFoundError as e:
        logger.exception(f"File not found when parsing {file_path}: {e}")
    except Exception as e:
        logger.error(f"Unexpected error processing {file_path}: {e}")


def _apply_text_overrides(src: ET.Element, dest: ET.Element) -> None:
    """
    Apply text content overrides from simple nodes in src to matching xpath nodes in dest.
    Special handling for 'content' nodes: ALL content nodes from parent override embedded files.

    This function identifies "simple nodes" (elements with no children but containing text)
    in the source element and applies their text content to matching xpath locations
    in the destination element. For 'content' nodes specifically, overrides are applied
    regardless of whether the text values differ.

    Simple nodes within <file> elements are excluded from override processing since
    <file> nodes are removed from the final output.

    Args:
        src (ET.Element): Source element to extract simple node text from.
        dest (ET.Element): Destination element to apply text overrides to.

    Algorithm:
        1. Find all simple nodes with text content in source (excluding file nodes)
        2. Build xpath-to-element mapping for destination
        3. For each simple node, find matching xpath in destination
        4. For 'content' nodes: Always override regardless of existing value
        5. For other nodes: Compare text values and apply override only if they differ

    Example:
        If source contains <config><content>parent_value</content></config>
        and destination contains <config><content>embedded_value</content></config>,
        the destination content will ALWAYS be overridden to "parent_value".

    Note:
        This function logs detailed status messages about overrides applied.
    """
    # Get all simple nodes (nodes without children) from source that have text content
    # Exclude simple nodes that are within file nodes
    simple_nodes_with_text = _get_simple_nodes_with_text(src, exclude_file_nodes=True)

    if not simple_nodes_with_text:
        return

    logger.debug(
        f"Found {len(simple_nodes_with_text)} simple nodes with text content to check for overrides (excluding file nodes)"
    )

    # Build xpath to element mapping for destination
    dest_xpath_map = _build_xpath_map(dest)

    # Apply overrides
    overrides_applied = 0
    content_overrides_applied = 0
    matches_checked = 0

    for xpath, src_text_content in simple_nodes_with_text.items():
        if xpath in dest_xpath_map:
            dest_elements = dest_xpath_map[xpath]
            for dest_element in dest_elements:
                matches_checked += 1
                dest_text = dest_element.text.strip() if dest_element.text else ""

                # Check if this is a 'content' node
                is_content_node = dest_element.tag == "content"

                # For content nodes: ALWAYS override regardless of existing value
                # For other nodes: Only apply override if text values differ
                should_override = is_content_node or (dest_text != src_text_content)

                if should_override:
                    dest_element.text = src_text_content

                    if is_content_node:
                        logger.debug(
                            f"Content override applied: {xpath} '{dest_text}' -> '{src_text_content}' (FORCED)"
                        )
                        content_overrides_applied += 1
                    else:
                        logger.debug(
                            f"Override applied: {xpath} '{dest_text}' -> '{src_text_content}'"
                        )
                    overrides_applied += 1

    if matches_checked > 0:
        logger.debug(
            f"Checked {matches_checked} matching xpath(s), applied {overrides_applied} text overrides "
            f"({content_overrides_applied} forced content overrides)"
        )
    else:
        logger.debug("No matching xpath nodes found for text overrides")


def _get_simple_nodes_with_text(
    element: ET.Element, current_path: str = "", exclude_file_nodes: bool = False
) -> Dict[str, str]:
    """
    Get all simple nodes (leaf nodes with text content) from an XML element tree.

    A "simple node" is defined as an element that has no child elements but contains
    text content. These nodes are candidates for text override operations.

    Args:
        element (ET.Element): Element to traverse for simple nodes.
        current_path (str, optional): Current xpath being built during traversal.
            Used internally for recursion. Defaults to "".
        exclude_file_nodes (bool, optional): If True, exclude nodes that are within
            <file> elements from the results. Defaults to False.

    Returns:
        Dict[str, str]: Dictionary mapping xpath strings to text content. Each xpath
            uniquely identifies a simple node location, and the value is the stripped
            text content of that node.

    Example:
        >>> element = ET.fromstring('<root><a>text1</a><b><c>text2</c></b></root>')
        >>> result = _get_simple_nodes_with_text(element)
        >>> print(result)
        {'root/a': 'text1', 'root/b/c': 'text2'}

    Note:
        Text content is automatically stripped of leading/trailing whitespace.
        Empty text content (after stripping) is ignored.
    """
    simple_nodes = {}

    # Build current xpath
    if current_path:
        xpath = f"{current_path}/{element.tag}"
    else:
        xpath = element.tag

    # Skip file nodes and their descendants if exclude_file_nodes is True
    if exclude_file_nodes and element.tag == "file":
        return simple_nodes

    # Check if this is a simple node (no children) with text content
    children = list(element)
    if not children and element.text and element.text.strip():
        simple_nodes[xpath] = element.text.strip()

    # Recursively process children
    for child in children:
        child_simple_nodes = _get_simple_nodes_with_text(
            child, xpath, exclude_file_nodes
        )
        simple_nodes.update(child_simple_nodes)

    return simple_nodes


def _build_xpath_map(
    element: ET.Element, current_path: str = ""
) -> Dict[str, List[ET.Element]]:
    """
    Build a mapping from xpath strings to lists of elements at those paths.

    This function creates a comprehensive index of all elements in an XML tree,
    organized by their xpath location. This enables efficient lookup of elements
    by xpath for operations like text overrides.

    Args:
        element (ET.Element): Element to traverse and map.
        current_path (str, optional): Current xpath being built during traversal.
            Used internally for recursion. Defaults to "".

    Returns:
        Dict[str, List[ET.Element]]: Dictionary mapping xpath strings to lists of
            elements found at those paths. Multiple elements can share the same
            xpath if there are duplicate element names at the same level.

    Example:
        >>> element = ET.fromstring('<root><a>1</a><a>2</a><b>3</b></root>')
        >>> xpath_map = _build_xpath_map(element)
        >>> len(xpath_map['root/a'])  # Two elements at this path
        2
        >>> len(xpath_map['root/b'])  # One element at this path
        1

    Note:
        The xpath format used is simplified and does not include array indices or
        attribute predicates. It's a simple hierarchical path using '/' separators.
    """
    xpath_map = {}

    # Build current xpath
    if current_path:
        xpath = f"{current_path}/{element.tag}"
    else:
        xpath = element.tag

    # Add current element to map
    if xpath not in xpath_map:
        xpath_map[xpath] = []
    xpath_map[xpath].append(element)

    # Recursively process children
    for child in element:
        child_xpath_map = _build_xpath_map(child, xpath)
        # Merge child maps
        for child_xpath, child_elements in child_xpath_map.items():
            if child_xpath not in xpath_map:
                xpath_map[child_xpath] = []
            xpath_map[child_xpath].extend(child_elements)

    return xpath_map


def _find_or_create_ccp4i2_body(root: ET.Element) -> ET.Element:
    """
    Find an existing ccp4i2_body element in the root, or create one if it doesn't exist.

    The ccp4i2_body element is a special container used in CCP4i2 XML documents to
    hold the main content. This function ensures that such an element exists in the
    destination document for content merging operations.

    Args:
        root (ET.Element): The root element to search in for ccp4i2_body.

    Returns:
        ET.Element: The ccp4i2_body element, either found or newly created.

    Search Strategy:
        Uses ".//ccp4i2_body" xpath to find ccp4i2_body elements anywhere in the
        document tree, not just as direct children of root.

    Creation Strategy:
        If no ccp4i2_body is found, creates one as a direct child of the root element.

    Note:
        This function logs status messages indicating whether an existing element
        was found or a new one was created.
    """
    # Try to find existing ccp4i2_body
    ccp4i2_body = root.find(".//ccp4i2_body")

    if ccp4i2_body is not None:
        logger.debug("Found existing ccp4i2_body in destination")
        return ccp4i2_body

    # Create new ccp4i2_body if not found
    logger.debug("Creating new ccp4i2_body in destination")
    ccp4i2_body = ET.SubElement(root, "ccp4i2_body")
    return ccp4i2_body


# Example usage and testing
if __name__ == "__main__":
    """
    Example usage demonstrating the load_nested_xml functionality.

    This example loads a real CCP4i2 pipeline definition file and processes it
    to show how file nodes are expanded and content is merged. It provides
    detailed output for debugging and verification purposes.
    """
    # Load XML from the prosmart_refmac.def.xml file
    xml_file_path = (
        pathlib.Path(CCP4File.__file__).parent.parent
        / "pipelines"
        / "prosmart_refmac"
        / "script"
        / "prosmart_refmac.def.xml"
    )

    try:
        print(f"Loading XML from: {xml_file_path}")

        # Check if file exists
        if not xml_file_path.exists():
            print(f"Error: XML file not found at {xml_file_path}")
            exit(1)

        # Parse the XML file
        tree = ET.parse(xml_file_path)
        root = tree.getroot()

        print(f"Successfully loaded XML. Root element: <{root.tag}>")
        print(f"Root attributes: {root.attrib}")

        # Count file nodes in the original XML
        original_file_nodes = root.findall(".//file")
        print(f"Original XML contains {len(original_file_nodes)} 'file' nodes")

        # Test the load_nested_xml function
        print("\n" + "=" * 60)
        print("Testing load_nested_xml with prosmart_refmac.def.xml:")
        print("=" * 60)

        copied_root = load_nested_xml(root)

        print(f"\nCopied successfully. Copied root element: <{copied_root.tag}>")
        print(f"Number of direct children in original: {len(list(root))}")
        print(f"Number of direct children in copy: {len(list(copied_root))}")

        # Verify file nodes have been removed
        result_file_nodes = copied_root.findall(".//file")
        print(f"\nResult contains {len(result_file_nodes)} 'file' nodes (should be 0)")

        # Check for ccp4i2_body in the result
        result_body_nodes = copied_root.findall(".//ccp4i2_body")
        if result_body_nodes:
            print(f"Result contains {len(result_body_nodes)} ccp4i2_body node(s)")
            for i, body_node in enumerate(result_body_nodes):
                children_count = len(list(body_node))
                print(f"  ccp4i2_body {i+1} has {children_count} children")
        else:
            print(f"No ccp4i2_body nodes in result")

        # Show simple nodes that would be candidates for text override
        simple_nodes = _get_simple_nodes_with_text(root, exclude_file_nodes=True)
        if simple_nodes:
            print(
                f"\nFound {len(simple_nodes)} simple nodes with text in original (excluding file nodes):"
            )
            for xpath, text in list(simple_nodes.items())[:10]:  # Show first 10
                print(f"  {xpath}: '{text}'")
            if len(simple_nodes) > 10:
                print(f"  ... and {len(simple_nodes) - 10} more")

        # Optionally print a sample of the XML structure (first few lines)
        xml_string = ET.tostring(copied_root, encoding="unicode")
        lines = xml_string.split("\n")
        print(f"\nFirst 50 lines of expanded XML structure (file nodes removed):")
        for i, line in enumerate(lines[:50]):
            print(f"{i+1:2d}: {line}")
        if len(lines) > 50:
            print(f"... ({len(lines) - 50} more lines)")

    except ET.ParseError as e:
        print(f"Error parsing XML file: {e}")
    except FileNotFoundError as e:
        print(f"File not found: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
