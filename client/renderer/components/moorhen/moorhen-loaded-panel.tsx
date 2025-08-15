import { moorhen } from "moorhen/types/moorhen";
import { hideMolecule, showMolecule } from "moorhen";
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
} from "@mui/material";
import { MoreVert, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";

interface MoleculeMenuState {
  anchorEl: HTMLElement | null;
  molecule: moorhen.Molecule | null;
}

export const MoorhenLoadedContent: React.FC<{
  onFileSelect: (fileId: number) => void;
}> = ({ onFileSelect }) => {
  const [menuState, setMenuState] = useState<MoleculeMenuState>({
    anchorEl: null,
    molecule: null,
  });
  const dispatch = useDispatch();
  const cootInitialized = useSelector(
    (state: moorhen.State) => state.generalStates.cootInitialized
  );
  const molecules = useSelector(
    (state: moorhen.State) => state.molecules.moleculeList
  );
  const visibleMolecules = useSelector(
    (state: moorhen.State) => state.molecules.visibleMolecules
  );

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    molecule: moorhen.Molecule
  ) => {
    event.stopPropagation(); // Prevent row click when opening menu
    setMenuState({
      anchorEl: event.currentTarget,
      molecule: molecule,
    });
  };

  const handleContextMenu = (
    event: React.MouseEvent<HTMLElement>,
    molecule: moorhen.Molecule
  ) => {
    event.preventDefault(); // Prevent browser context menu
    setMenuState({
      anchorEl: event.currentTarget,
      molecule: molecule,
    });
  };

  const handleMenuClose = () => {
    setMenuState({
      anchorEl: null,
      molecule: null,
    });
  };

  const handleHideMolecule = () => {
    if (menuState.molecule) {
      dispatch(hideMolecule({ molNo: menuState.molecule.molNo }));
    }
    handleMenuClose();
  };

  const handleShowMolecule = () => {
    if (menuState.molecule) {
      dispatch(showMolecule({ molNo: menuState.molecule.molNo, show: true }));
    }
    handleMenuClose();
  };

  const handleDeleteMolecule = () => {
    if (menuState.molecule) {
      // Add delete logic here
      console.log("Delete molecule:", menuState.molecule.name);
    }
    handleMenuClose();
  };

  const handleCenterOnMolecule = () => {
    if (menuState.molecule) {
      menuState.molecule.centreOn("/*/*/*/*", false, true);
    }
    handleMenuClose();
  };

  const handleItemClick = (molecule: moorhen.Molecule) => {
    if (isVisible(molecule)) {
      dispatch(hideMolecule({ molNo: molecule.molNo }));
    } else {
      dispatch(showMolecule({ molNo: molecule.molNo, show: true }));
    }
  };

  const isVisible = (molecule: moorhen.Molecule) => {
    return visibleMolecules.includes(molecule.molNo);
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

  if (!molecules || molecules.length === 0) {
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
          No molecules loaded.
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
        <List
          sx={{
            width: "100%",
            bgcolor: "background.paper",
            padding: 0,
          }}
        >
          {molecules.map((molecule, index) => (
            <ListItem
              key={molecule.molNo}
              disablePadding
              sx={{
                borderBottom:
                  index < molecules.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <ListItemButton
                onClick={() => handleItemClick(molecule)}
                onContextMenu={(event) => handleContextMenu(event, molecule)}
                sx={{
                  paddingY: 1,
                  paddingX: 2,
                  "&:hover": {
                    backgroundColor: "#f9f9f9",
                  },
                  opacity: isVisible(molecule) ? 1 : 0.6,
                  textDecoration: isVisible(molecule) ? "none" : "line-through",
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        label={molecule.molNo}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          minWidth: "40px",
                          height: "20px",
                        }}
                      />
                      {molecule.uniqueId && (
                        <Chip
                          label={molecule.uniqueId}
                          size="small"
                          variant="filled"
                          color="secondary"
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
                          fontWeight: isVisible(molecule)
                            ? "normal"
                            : "lighter",
                          flex: 1,
                        }}
                      >
                        {molecule.name}
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
                      {isVisible(molecule) ? (
                        <Visibility fontSize="small" color="action" />
                      ) : (
                        <VisibilityOff fontSize="small" color="disabled" />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {isVisible(molecule) ? "Visible" : "Hidden"}
                      </Typography>
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(event) => handleMenuOpen(event, molecule)}
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
        {menuState.molecule && isVisible(menuState.molecule) ? (
          <MenuItem onClick={handleHideMolecule}>
            <VisibilityOff sx={{ mr: 1 }} fontSize="small" />
            Hide Molecule
          </MenuItem>
        ) : (
          <MenuItem onClick={handleShowMolecule}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            Show Molecule
          </MenuItem>
        )}
        <MenuItem onClick={handleCenterOnMolecule}>
          <Typography sx={{ mr: 1 }}>🎯</Typography>
          Center on Molecule
        </MenuItem>
        <MenuItem onClick={handleDeleteMolecule} sx={{ color: "error.main" }}>
          <Typography sx={{ mr: 1 }}>🗑️</Typography>
          Delete Molecule
        </MenuItem>
      </Menu>
    </Box>
  );
};
