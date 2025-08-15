import { moorhen } from "moorhen/types/moorhen";
import { hideMolecule, showMolecule, hideMap, showMap } from "moorhen";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Paper,
  Chip,
  Stack,
  Toolbar,
} from "@mui/material";
import { MoreVert, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";

type ContentType = "Molecule" | "Map";
type ContentItem = moorhen.Molecule | moorhen.Map;

interface ItemMenuState {
  anchorEl: HTMLElement | null;
  item: ContentItem | null;
}

interface MoorhenLoadedContentProps {
  onFileSelect: (fileId: number) => void;
  type: ContentType;
}

export const MoorhenLoadedContent: React.FC<MoorhenLoadedContentProps> = ({
  onFileSelect,
  type = "Molecule",
}) => {
  const [menuState, setMenuState] = useState<ItemMenuState>({
    anchorEl: null,
    item: null,
  });
  const dispatch = useDispatch();
  const cootInitialized = useSelector(
    (state: moorhen.State) => state.generalStates.cootInitialized
  );

  // Molecule selectors
  const molecules = useSelector(
    (state: moorhen.State) => state.molecules.moleculeList
  );
  const visibleMolecules = useSelector(
    (state: moorhen.State) => state.molecules.visibleMolecules
  );

  // Map selectors
  const maps = useSelector((state: moorhen.State) => state.maps);
  const visibleMaps = useSelector(
    (state: moorhen.State) => state.mapContourSettings.visibleMaps
  );

  // Get the appropriate data based on type
  const items = type === "Molecule" ? molecules : maps;
  const visibleItems = type === "Molecule" ? visibleMolecules : visibleMaps;

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    item: ContentItem
  ) => {
    event.stopPropagation(); // Prevent row click when opening menu
    setMenuState({
      anchorEl: event.currentTarget,
      item: item,
    });
  };

  const handleContextMenu = (
    event: React.MouseEvent<HTMLElement>,
    item: ContentItem
  ) => {
    event.preventDefault(); // Prevent browser context menu
    setMenuState({
      anchorEl: event.currentTarget,
      item: item,
    });
  };

  const handleMenuClose = () => {
    setMenuState({
      anchorEl: null,
      item: null,
    });
  };

  const handleHideItem = () => {
    if (menuState.item) {
      if (type === "Molecule") {
        const molecule = menuState.item as moorhen.Molecule;
        dispatch(hideMolecule({ molNo: molecule.molNo }));
      } else {
        const map = menuState.item as moorhen.Map;
        dispatch(hideMap({ molNo: map.molNo }));
      }
    }
    handleMenuClose();
  };

  const handleShowItem = () => {
    if (menuState.item) {
      if (type === "Molecule") {
        const molecule = menuState.item as moorhen.Molecule;
        dispatch(showMolecule({ molNo: molecule.molNo, show: true }));
      } else {
        const map = menuState.item as moorhen.Map;
        dispatch(showMap({ molNo: map.molNo, show: true }));
      }
    }
    handleMenuClose();
  };

  const handleDeleteItem = () => {
    if (menuState.item) {
      // Add delete logic here
      console.log(`Delete ${type.toLowerCase()}:`, menuState.item.name);
    }
    handleMenuClose();
  };

  const handleCenterOnItem = () => {
    if (menuState.item) {
      if (type === "Molecule") {
        const molecule = menuState.item as moorhen.Molecule;
        molecule.centreOn("/*/*/*/*", false, true);
      } else {
        const map = menuState.item as moorhen.Map;
        // Add map centering logic if available
        console.log("Center on map:", map.name);
      }
    }
    handleMenuClose();
  };

  const handleItemClick = (item: ContentItem) => {
    if (isVisible(item)) {
      if (type === "Molecule") {
        const molecule = item as moorhen.Molecule;
        dispatch(hideMolecule({ molNo: molecule.molNo }));
      } else {
        const map = item as moorhen.Map;
        dispatch(hideMap({ molNo: map.molNo }));
      }
    } else {
      if (type === "Molecule") {
        const molecule = item as moorhen.Molecule;
        dispatch(showMolecule({ molNo: molecule.molNo, show: true }));
      } else {
        const map = item as moorhen.Map;
        dispatch(showMap({ molNo: map.molNo, show: true }));
      }
    }
  };

  const isVisible = (item: ContentItem) => {
    if (type === "Molecule") {
      const molecule = item as moorhen.Molecule;
      return visibleMolecules.includes(molecule.molNo);
    } else {
      const map = item as moorhen.Map;
      return visibleMaps.includes(map.molNo);
    }
  };

  const getItemId = (item: ContentItem) => {
    return item.molNo;
  };

  const getItemUniqueId = (item: ContentItem) => {
    if (type === "Molecule") {
      const molecule = item as moorhen.Molecule;
      return molecule.uniqueId;
    } else {
      const map = item as moorhen.Map;
      return (map as any).uniqueId; // Assuming maps might have uniqueId
    }
  };

  if (!cootInitialized) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No {type.toLowerCase()}s loaded.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper
        sx={{
          flex: 1,
          overflow: "auto",
          boxShadow: "none",
          border: "1px solid #e0e0e0",
        }}
      >
        <Toolbar>Loaded {type}s</Toolbar>
        <List
          sx={{
            width: "100%",
            bgcolor: "background.paper",
            padding: 0,
          }}
        >
          {items.map((item, index) => (
            <ListItem
              key={getItemId(item)}
              disablePadding
              sx={{
                borderBottom:
                  index < items.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <ListItemButton
                onClick={() => handleItemClick(item)}
                onContextMenu={(event) => handleContextMenu(event, item)}
                sx={{
                  paddingY: 1,
                  paddingX: 2,
                  "&:hover": {
                    backgroundColor: "#f9f9f9",
                  },
                  opacity: isVisible(item) ? 1 : 0.6,
                  textDecoration: isVisible(item) ? "none" : "line-through",
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        label={getItemId(item)}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          minWidth: "40px",
                          height: "20px",
                        }}
                      />
                      {getItemUniqueId(item) && (
                        <Chip
                          label={getItemUniqueId(item)}
                          size="small"
                          variant="filled"
                          color={type === "Molecule" ? "secondary" : "primary"}
                          sx={{
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            height: "20px",
                          }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isVisible(item) ? "normal" : "lighter",
                          flex: 1,
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ mt: 0.5 }}
                    >
                      {isVisible(item) ? (
                        <Visibility fontSize="small" color="action" />
                      ) : (
                        <VisibilityOff fontSize="small" color="disabled" />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {isVisible(item) ? "Visible" : "Hidden"} {type}
                      </Typography>
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(event) => handleMenuOpen(event, item)}
                    sx={{
                      marginRight: 1,
                      opacity: 0.7,
                      "&:hover": {
                        opacity: 1,
                      },
                    }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Contextual Menu */}
      <Menu
        anchorEl={menuState.anchorEl}
        open={Boolean(menuState.anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: "180px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        {menuState.item && isVisible(menuState.item) ? (
          <MenuItem onClick={handleHideItem}>
            <VisibilityOff sx={{ mr: 1 }} fontSize="small" />
            Hide {type}
          </MenuItem>
        ) : (
          <MenuItem onClick={handleShowItem}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            Show {type}
          </MenuItem>
        )}
        <MenuItem onClick={handleCenterOnItem}>
          <Typography sx={{ mr: 1 }}>🎯</Typography>
          Center on {type}
        </MenuItem>
        <MenuItem onClick={handleDeleteItem} sx={{ color: "error.main" }}>
          <Typography sx={{ mr: 1 }}>🗑️</Typography>
          Delete {type}
        </MenuItem>
      </Menu>
    </Box>
  );
};
