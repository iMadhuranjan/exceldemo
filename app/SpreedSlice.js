import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [
    ["Name", "Age", "City"],
    ["John", "25", "New York"],
    ["Alice", "30", "Los Angeles"],
    ["Bob", "40", "Chicago"],
    ["John", "28", "Houston"],
  ],
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
      const newRow = new Array(state.data[0].length).fill("");
      state.data.push(newRow);
    },
    addColumn: (state) => {
      state.data.forEach((row) => row.push(""));
      state.columnWidths.push(100);
    },
    setData: (state, action) => {
      state.data = action.payload;
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
