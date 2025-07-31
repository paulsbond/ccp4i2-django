import React, { useState, useMemo, useCallback, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

export interface FileSystemItem {
  path: string;
  name: string;
  type: "directory" | "file";
  size?: number;
  mode?: number;
  inode?: number;
  device?: number;
  nlink?: number;
  uid?: number;
  gid?: number;
  atime?: number;
  mtime?: number;
  ctime?: number;
  contents?: FileSystemItem[];
}

export interface DirectoryBrowserProps {
  directoryTree: FileSystemItem[];
  title?: string;
  width?: string | number;
  height?: string | number;
  fileFilter?: (item: FileSystemItem) => boolean;
  showSearch?: boolean;
  showFileSizes?: boolean;
  onItemClick?: (item: FileSystemItem, event: React.MouseEvent) => void;
  onItemDoubleClick?: (item: FileSystemItem, event: React.MouseEvent) => void;
  onItemRightClick?: (item: FileSystemItem, event: React.MouseEvent) => void;
  onMenuOpen?: (item: FileSystemItem, anchorEl: HTMLElement) => void;
  selectedItems?: Set<string>;
  multiSelect?: boolean;
}

interface TreeNodeProps {
  item: FileSystemItem;
  level: number;
  expandedNodes: Set<string>;
  onToggleExpand: (path: string) => void;
  searchTerm: string;
  fileFilter?: (item: FileSystemItem) => boolean;
  showFileSizes: boolean;
  onItemClick?: (item: FileSystemItem, event: React.MouseEvent) => void;
  onItemDoubleClick?: (item: FileSystemItem, event: React.MouseEvent) => void;
  onItemRightClick?: (item: FileSystemItem, event: React.MouseEvent) => void;
  onMenuOpen?: (item: FileSystemItem, anchorEl: HTMLElement) => void;
  selectedItems?: Set<string>;
}

const DirectoryBrowser: React.FC<DirectoryBrowserProps> = ({
  directoryTree,
  title = "Files",
  width = "100%",
  height = "100%",
  fileFilter,
  showSearch = true,
  showFileSizes = true,
  onItemClick,
  onItemDoubleClick,
  onItemRightClick,
  onMenuOpen,
  selectedItems = new Set(),
  multiSelect = false,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Filter directory tree based on provided filter function
  const filteredTree = useMemo(() => {
    if (!fileFilter) return directoryTree;

    const filterItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items
        .map((item) => {
          if (item.type === "directory") {
            const filteredContents = item.contents
              ? filterItems(item.contents)
              : [];
            if (filteredContents.length > 0) {
              return { ...item, contents: filteredContents };
            }
            return null;
          } else if (item.type === "file" && fileFilter(item)) {
            return item;
          }
          return null;
        })
        .filter((item): item is FileSystemItem => item !== null);
    };

    return filterItems(directoryTree);
  }, [directoryTree, fileFilter]);

  // Search functionality
  const searchFilteredTree = useMemo(() => {
    if (!searchTerm.trim()) return filteredTree;

    const filterBySearch = (items: FileSystemItem[]): FileSystemItem[] => {
      return items
        .map((item) => {
          if (item.type === "directory") {
            const filteredContents = item.contents
              ? filterBySearch(item.contents)
              : [];
            if (
              filteredContents.length > 0 ||
              item.name.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              return { ...item, contents: filteredContents };
            }
            return null;
          } else if (
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return item;
          }
          return null;
        })
        .filter((item): item is FileSystemItem => item !== null);
    };

    return filterBySearch(filteredTree);
  }, [filteredTree, searchTerm]);

  const handleToggleExpand = useCallback((path: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const TreeNode: React.FC<TreeNodeProps> = ({
    item,
    level,
    expandedNodes,
    onToggleExpand,
    searchTerm,
    fileFilter,
    showFileSizes,
    onItemClick,
    onItemDoubleClick,
    onItemRightClick,
    onMenuOpen,
    selectedItems,
  }) => {
    const isExpanded = expandedNodes.has(item.path);
    const isSelected = selectedItems?.has(item.path) || false;
    const hasChildren =
      item.type === "directory" && item.contents && item.contents.length > 0;

    // Highlight search term
    const highlightText = (text: string, term: string) => {
      if (!term.trim()) return text;
      const regex = new RegExp(`(${term})`, "gi");
      const parts = text.split(regex);
      return parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} style={{ backgroundColor: "#ffeb3b", padding: 0 }}>
            {part}
          </mark>
        ) : (
          part
        )
      );
    };

    const handleClick = (event: React.MouseEvent) => {
      event.stopPropagation();
      if (item.type === "directory") {
        onToggleExpand(item.path);
      }
      onItemClick?.(item, event);
    };

    const handleDoubleClick = (event: React.MouseEvent) => {
      event.stopPropagation();
      onItemDoubleClick?.(item, event);
    };

    const handleRightClick = (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onItemRightClick?.(item, event);
    };

    const handleMenuClick = (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onMenuOpen?.(item, event.currentTarget as HTMLElement);
    };

    return (
      <Box>
        <Box
          data-tree-item-row={item.path} // Add this specific identifier
          sx={{
            display: "flex",
            alignItems: "center",
            paddingLeft: `${level * 16}px`,
            paddingY: 0.5,
            cursor: "pointer",
            backgroundColor: isSelected ? "action.selected" : "transparent",
            "&:hover": {
              backgroundColor: isSelected ? "action.selected" : "action.hover",
              "& .menu-button": {
                opacity: 1,
              },
            },
            borderRadius: 1,
            margin: 0.25,
            position: "relative",
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleRightClick}
        >
          {/* Always show caret area for directories to maintain alignment */}
          {item.type === "directory" ? (
            <IconButton
              size="small"
              sx={{
                padding: 0.25,
                marginRight: 0.5,
                visibility: hasChildren ? "visible" : "hidden",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) {
                  onToggleExpand(item.path);
                }
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ExpandMoreIcon fontSize="small" />
                ) : (
                  <ChevronRightIcon fontSize="small" />
                )
              ) : (
                <ChevronRightIcon fontSize="small" style={{ opacity: 0 }} />
              )}
            </IconButton>
          ) : (
            <Box sx={{ width: 32, height: 24, marginRight: 0.5 }} />
          )}

          {item.type === "directory" ? (
            isExpanded ? (
              <FolderOpenIcon
                fontSize="small"
                sx={{ marginRight: 1, color: "primary.main" }}
              />
            ) : (
              <FolderIcon
                fontSize="small"
                sx={{ marginRight: 1, color: "primary.main" }}
              />
            )
          ) : (
            <FileIcon
              fontSize="small"
              sx={{ marginRight: 1, color: "text.secondary" }}
            />
          )}

          <Typography
            variant="body2"
            sx={{
              fontFamily: item.type === "directory" ? "inherit" : "monospace",
              fontSize: "0.875rem",
              color: isSelected ? "primary.main" : "text.primary",
              fontWeight: isSelected ? "medium" : "normal",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {highlightText(item.name, searchTerm)}
          </Typography>

          {showFileSizes && item.type === "file" && item.size && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: "0.75rem",
                marginRight: 1,
                flexShrink: 0,
              }}
            >
              {(item.size / 1024).toFixed(1)} KB
            </Typography>
          )}

          {onMenuOpen && (
            <IconButton
              className="menu-button"
              size="small"
              sx={{
                opacity: 0,
                transition: "opacity 0.2s",
                padding: 0.25,
                marginLeft: 0.5,
                flexShrink: 0,
              }}
              onClick={handleMenuClick}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {item.type === "directory" && hasChildren && (
          <Collapse in={isExpanded}>
            <Box>
              {item.contents!.map((child) => (
                <TreeNode
                  key={child.path}
                  item={child}
                  level={level + 1}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  searchTerm={searchTerm}
                  fileFilter={fileFilter}
                  showFileSizes={showFileSizes}
                  onItemClick={onItemClick}
                  onItemDoubleClick={onItemDoubleClick}
                  onItemRightClick={onItemRightClick}
                  onMenuOpen={onMenuOpen}
                  selectedItems={selectedItems}
                />
              ))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Paper
      sx={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        borderRadius: 0,
        borderRight: 1,
        borderColor: "divider",
        minWidth: 0,
        flex: width === "100%" ? 1 : undefined,
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {showSearch && (
          <TextField
            size="small"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
        {searchFilteredTree.length > 0 ? (
          searchFilteredTree.map((item) => (
            <TreeNode
              key={item.path}
              item={item}
              level={0}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
              searchTerm={searchTerm}
              fileFilter={fileFilter}
              showFileSizes={showFileSizes}
              onItemClick={onItemClick}
              onItemDoubleClick={onItemDoubleClick}
              onItemRightClick={onItemRightClick}
              onMenuOpen={onMenuOpen}
              selectedItems={selectedItems}
            />
          ))
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2, textAlign: "center" }}
          >
            {searchTerm ? "No matching files found" : "No files found"}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default DirectoryBrowser;
