import xml.etree.ElementTree as ET
import pathlib
from typing import Optional, Dict, List
from ccp4i2.core import CCP4File


def load_nested_xml(src: ET.Element, dest: Optional[ET.Element] = None) -> ET.Element:
    """
    Copy an etree element to another etree element with special handling for 'file' nodes.
    File nodes are processed for their embedded content but are not included in the final XML.

    Args:
        src: Source etree element to copy from
        dest: Optional destination etree element to copy to. If None, creates a new empty element.

    Returns:
        The destination etree element with copied content
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
    Parse referenced XML files and merge their ccp4i2_body children.
    The file node itself is NOT added to the destination.

    Args:
        file_node: The file element to process
        dest_root: The root destination element to merge ccp4i2_body children into
    """
    # Find the CI2XmlDataFile child node
    ci2_xml_data_file = file_node.find("CI2XmlDataFile")
    if ci2_xml_data_file is None:
        return

    # Extract project, baseName, and relPath
    project_node = ci2_xml_data_file.find("project")
    base_name_node = ci2_xml_data_file.find("baseName")
    rel_path_node = ci2_xml_data_file.find("relPath")

    if project_node is None or base_name_node is None or rel_path_node is None:
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

        # Print the path
        print(f"CCP4I2_TOP file path: {file_path} (file node will be removed)")

        # Parse the XML file and merge ccp4i2_body children
        _parse_and_merge_xml_file(file_path, dest_root)


def _parse_and_merge_xml_file(file_path: pathlib.Path, dest_root: ET.Element) -> None:
    """
    Parse an XML file and merge its ccp4i2_body children into the destination root.

    Args:
        file_path: Path to the XML file to parse
        dest_root: The root destination element to merge ccp4i2_body children into
    """
    try:
        print(f"  Attempting to parse XML file: {file_path}")

        # Check if file exists
        if not file_path.exists():
            print(f"  Warning: File not found: {file_path}")
            return

        # Parse the XML file
        tree = ET.parse(file_path)
        parsed_root = tree.getroot()

        print(f"  Successfully parsed XML. Root element: <{parsed_root.tag}>")

        # Find all ccp4i2_body nodes in the parsed XML
        ccp4i2_body_nodes = parsed_root.findall(".//ccp4i2_body")

        if not ccp4i2_body_nodes:
            print(f"  No ccp4i2_body nodes found in {file_path}")
            return

        print(f"  Found {len(ccp4i2_body_nodes)} ccp4i2_body node(s)")

        # Find or create ccp4i2_body in destination
        dest_ccp4i2_body = _find_or_create_ccp4i2_body(dest_root)

        # Merge children from all ccp4i2_body nodes
        total_merged = 0
        for i, body_node in enumerate(ccp4i2_body_nodes):
            children_count = len(list(body_node))
            print(f"  Processing ccp4i2_body node {i+1} with {children_count} children")

            # Copy all children of the ccp4i2_body node using our recursive function
            # This will also remove any nested file nodes while processing their content
            for child in body_node:
                child_copy = load_nested_xml(child)
                dest_ccp4i2_body.append(child_copy)
                total_merged += 1

        print(
            f"  Successfully merged {total_merged} children into destination ccp4i2_body"
        )

    except ET.ParseError as e:
        print(f"  Error parsing XML file {file_path}: {e}")
    except Exception as e:
        print(f"  Unexpected error processing {file_path}: {e}")


def _apply_text_overrides(src: ET.Element, dest: ET.Element) -> None:
    """
    Apply text content overrides from simple (child-free) nodes in src to matching xpath nodes in dest.
    Only applies overrides from non-file nodes and only when text values differ.

    Args:
        src: Source element to extract simple node text from
        dest: Destination element to apply overrides to
    """
    # Get all simple nodes (nodes without children) from source that have text content
    # Exclude simple nodes that are within file nodes
    simple_nodes_with_text = _get_simple_nodes_with_text(src, exclude_file_nodes=True)

    if not simple_nodes_with_text:
        return

    print(
        f"  Found {len(simple_nodes_with_text)} simple nodes with text content to check for overrides (excluding file nodes)"
    )

    # Build xpath to element mapping for destination
    dest_xpath_map = _build_xpath_map(dest)

    # Apply overrides only when text differs
    overrides_applied = 0
    matches_checked = 0

    for xpath, src_text_content in simple_nodes_with_text.items():
        if xpath in dest_xpath_map:
            dest_elements = dest_xpath_map[xpath]
            for dest_element in dest_elements:
                matches_checked += 1
                dest_text = dest_element.text.strip() if dest_element.text else ""

                # Only apply override if text values differ
                if dest_text != src_text_content:
                    dest_element.text = src_text_content
                    print(
                        f"    Override applied: {xpath} '{dest_text}' -> '{src_text_content}'"
                    )
                    overrides_applied += 1

    if matches_checked > 0:
        print(
            f"  Checked {matches_checked} matching xpath(s), applied {overrides_applied} text overrides"
        )
    else:
        print(f"  No matching xpath nodes found for text overrides")


def _get_simple_nodes_with_text(
    element: ET.Element, current_path: str = "", exclude_file_nodes: bool = False
) -> Dict[str, str]:
    """
    Get all simple nodes (nodes without children) that have text content.

    Args:
        element: Element to traverse
        current_path: Current xpath being built
        exclude_file_nodes: If True, exclude nodes that are within file elements

    Returns:
        Dictionary mapping xpath to text content
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
    Build a mapping from xpath to list of elements at that path.

    Args:
        element: Element to traverse
        current_path: Current xpath being built

    Returns:
        Dictionary mapping xpath to list of elements
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

    Args:
        root: The root element to search in

    Returns:
        The ccp4i2_body element
    """
    # Try to find existing ccp4i2_body
    ccp4i2_body = root.find(".//ccp4i2_body")

    if ccp4i2_body is not None:
        print(f"  Found existing ccp4i2_body in destination")
        return ccp4i2_body

    # Create new ccp4i2_body if not found
    print(f"  Creating new ccp4i2_body in destination")
    ccp4i2_body = ET.SubElement(root, "ccp4i2_body")
    return ccp4i2_body


# Example usage and testing
if __name__ == "__main__":
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
