import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { Editor } from "@monaco-editor/react";

interface FileSystemItem {
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

interface LogViewerProps {
  directoryTree: FileSystemItem[];
  projectId: number;
}

interface TreeNodeProps {
  item: FileSystemItem;
  level: number;
  expandedNodes: Set<string>;
  onToggleExpand: (path: string) => void;
  onFileSelect: (item: FileSystemItem) => void;
  selectedFile: FileSystemItem | null;
  searchTerm: string;
}

const LogViewer: React.FC<LogViewerProps> = ({ directoryTree, projectId }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Function to check if a file is a log file
  const isLogFile = useCallback((name: string): boolean => {
    const logExtensions = [".log", ".txt"];
    const logPatterns = [
      /\.log$/i,
      /log\.txt$/i,
      /stdout\.txt$/i,
      /stderr\.txt$/i,
      /\.log$/i,
      /diagnostic\.xml$/i,
    ];

    return (
      logPatterns.some((pattern) => pattern.test(name)) ||
      logExtensions.some((ext) => name.toLowerCase().endsWith(ext))
    );
  }, []);

  // Filter directory tree to include only directories and log files
  const filteredTree = useMemo(() => {
    const filterItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items
        .map((item) => {
          if (item.type === "directory") {
            const filteredContents = item.contents
              ? filterItems(item.contents)
              : [];
            // Include directory if it has log files or subdirectories with log files
            if (filteredContents.length > 0) {
              return { ...item, contents: filteredContents };
            }
            return null;
          } else if (item.type === "file" && isLogFile(item.name)) {
            return item;
          }
          return null;
        })
        .filter((item): item is FileSystemItem => item !== null);
    };

    return filterItems(directoryTree);
  }, [directoryTree, isLogFile]);

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

  const handleFileSelect = useCallback(async (item: FileSystemItem) => {
    if (item.type === "file") {
      setSelectedFile(item);
      setLoading(true);
      setError(null);

      try {
        // Fetch file content from your API
        const response = await fetch(
          `/api/proxy/projects/${projectId}/project_file?path=${encodeURIComponent(
            item.path
          )}`
        );
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`);
        }
        const content = await response.text();
        setFileContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
        setFileContent("");
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const getFileLanguage = useCallback((fileName: string): string => {
    if (fileName.endsWith(".xml")) return "xml";
    if (fileName.endsWith(".log") || fileName.endsWith(".txt")) return "text";
    return "text";
  }, []);

  const TreeNode: React.FC<TreeNodeProps> = ({
    item,
    level,
    expandedNodes,
    onToggleExpand,
    onFileSelect,
    selectedFile,
    searchTerm,
  }) => {
    const isExpanded = expandedNodes.has(item.path);
    const isSelected = selectedFile?.path === item.path;
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

    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            paddingLeft: `${level * 16}px`,
            paddingY: 0.5,
            cursor: "pointer",
            backgroundColor: isSelected ? "action.selected" : "transparent",
            "&:hover": {
              backgroundColor: isSelected ? "action.selected" : "action.hover",
            },
            borderRadius: 1,
            margin: 0.25,
          }}
          onClick={() => {
            if (item.type === "directory") {
              onToggleExpand(item.path);
            } else {
              onFileSelect(item);
            }
          }}
        >
          {item.type === "directory" && (
            <IconButton
              size="small"
              sx={{ padding: 0.25, marginRight: 0.5 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(item.path);
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ExpandMoreIcon fontSize="small" />
                ) : (
                  <ChevronRightIcon fontSize="small" />
                )
              ) : null}
            </IconButton>
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
              sx={{ marginRight: 1, marginLeft: 3, color: "text.secondary" }}
            />
          )}

          <Typography
            variant="body2"
            sx={{
              fontFamily: item.type === "directory" ? "inherit" : "monospace",
              fontSize: "0.875rem",
              color: isSelected ? "primary.main" : "text.primary",
              fontWeight: isSelected ? "medium" : "normal",
            }}
          >
            {highlightText(item.name, searchTerm)}
          </Typography>

          {item.type === "file" && item.size && (
            <Typography
              variant="caption"
              sx={{
                marginLeft: "auto",
                color: "text.secondary",
                fontSize: "0.75rem",
              }}
            >
              {(item.size / 1024).toFixed(1)} KB
            </Typography>
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
                  onFileSelect={onFileSelect}
                  selectedFile={selectedFile}
                  searchTerm={searchTerm}
                />
              ))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left Panel - Tree View */}
      <Paper
        sx={{
          width: "350px",
          display: "flex",
          flexDirection: "column",
          borderRadius: 0,
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" gutterBottom>
            Log Files
          </Typography>
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
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                searchTerm={searchTerm}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ p: 2, textAlign: "center" }}
            >
              {searchTerm
                ? "No matching log files found"
                : "No log files found"}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Right Panel - Editor */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {selectedFile ? (
          <>
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}
            >
              <Typography variant="h6" noWrap>
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {selectedFile.path}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, position: "relative" }}>
              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ p: 2 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              ) : (
                <Editor
                  height="100%"
                  language={getFileLanguage(selectedFile.name)}
                  value={fileContent}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    lineNumbers: "on",
                    folding: true,
                    fontSize: 12,
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  }}
                  theme="vs-light"
                />
              )}
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "text.secondary",
            }}
          >
            <Typography variant="h6">
              Select a log file to view its contents
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LogViewer;
