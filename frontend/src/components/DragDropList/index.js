import React, { useState } from "react";
import { Box, Paper } from "@mui/material";
import { DragIndicator as DragIcon } from "@mui/icons-material";
import PropTypes from "prop-types";

const DragDropList = ({ items, onReorder, renderItem }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const draggedItemData = newItems[draggedItem];

    // Remove dragged item
    newItems.splice(draggedItem, 1);

    // Insert at new position
    const insertIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
    newItems.splice(insertIndex, 0, draggedItemData);

    onReorder(newItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <Box>
      {items.map((item, index) => (
        <Paper
          key={item.id || index}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          sx={{
            p: 2,
            mb: 2,
            border: "1px solid",
            borderColor: dragOverIndex === index ? "primary.main" : "divider",
            backgroundColor: draggedItem === index ? "action.hover" : "background.paper",
            cursor: "move",
            opacity: draggedItem === index ? 0.5 : 1,
            transform: dragOverIndex === index ? "scale(1.02)" : "scale(1)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <DragIcon
            sx={{
              mr: 1,
              mt: 0.5,
              color: "action.active",
              cursor: "grab",
              "&:active": { cursor: "grabbing" },
            }}
          />
          <Box sx={{ flexGrow: 1 }}>{renderItem(item, index)}</Box>
        </Paper>
      ))}
    </Box>
  );
};

DragDropList.propTypes = {
  items: PropTypes.array.isRequired,
  onReorder: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
};

export default DragDropList;
