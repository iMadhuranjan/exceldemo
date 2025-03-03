import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Row 0 is the header row
  data: [
    ["Name", "Age", "City"],
    ["John", "25", "New York"],
    ["Alice", "30", "Los Angeles"],
    ["Bob", "40", "Chicago"],
    ["John", "28", "Houston"],
  ],
  // Start each column at 100px
  columnWidths: [100, 100, 100],
};

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    updateCell: (state, action) => {
      const { rowIndex, colIndex, value } = action.payload;
      state.data[rowIndex][colIndex] = value;
    },
    addRow: (state) => {
      // Add a new row with the same number of columns as the header
      const newRow = new Array(state.data[0].length).fill("");
      state.data.push(newRow);
    },
    addColumn: (state) => {
      // For each existing row, push an empty cell
      state.data.forEach((row) => row.push(""));
      // Push a new 100px width for the new column
      state.columnWidths.push(100);
    },
    setData: (state, action) => {
      // Replace the entire data with the imported data
      state.data = action.payload;
      // Reset all columns to 100px
      state.columnWidths = new Array(action.payload[0].length).fill(100);
    },
    setColumnWidth: (state, action) => {
      const { colIndex, width } = action.payload;
      state.columnWidths[colIndex] = width;
    },
  },
});

export const {
  updateCell,
  addRow,
  addColumn,
  setData,
  setColumnWidth,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;
