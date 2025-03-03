"use client";
import React, { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateCell,
  addRow,
  addColumn,
  setData,
  setColumnWidth,
} from "./SpreedSlice";
import * as XLSX from "xlsx";

export default function Spreadsheet() {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.spreadsheet.data);
  const columnWidths = useSelector((state) => state.spreadsheet.columnWidths);
  const fileInputRef = useRef(null);

  // filterValues holds, for each column, the set of allowed values.
  // When a user manually chooses filter options (e.g. selects only “10”),
  // that column’s flag in filterCustomized is set to true.
  const [filterValues, setFilterValues] = useState(() =>
    data[0].map(
      (_, colIndex) =>
        new Set(Array.from(new Set(data.slice(1).map((row) => row[colIndex]))))
    )
  );
  // When false, the column is unfiltered (auto–updated).
  // When true, the column is manually filtered.
  const [filterCustomized, setFilterCustomized] = useState(() =>
    new Array(data[0].length).fill(false)
  );
  // Controls whether each column’s filter dropdown is open.
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(() =>
    new Array(data[0].length).fill(false)
  );

  // Compute distinct available options for each column from current data.
  const distinctValuesByCol = data[0].map((_, colIndex) =>
    Array.from(new Set(data.slice(1).map((row) => row[colIndex]))).sort()
  );

  // When data (or number of columns) changes, update states.
  // Note: We removed filterCustomized from the dependency array to prevent infinite updates.
  useEffect(() => {
    setFilterValues((prev) => {
      let newSel = [...prev];
      for (let i = 0; i < data[0].length; i++) {
        if (i >= newSel.length) {
          newSel[i] = new Set(); // New column gets an empty set (or could be initialized as desired)
        }
      }
      return newSel.slice(0, data[0].length);
    });
    setFilterDropdownOpen(new Array(data[0].length).fill(false));
    setFilterCustomized((prev) => {
      let newArr = [...prev];
      for (let i = 0; i < data[0].length; i++) {
        if (i >= newArr.length) {
          newArr[i] = false;
        }
      }
      return newArr.slice(0, data[0].length);
    });
  }, [data]);

  // Toggle filter dropdown open/close for a column.
  const toggleFilterDropdown = (colIndex) => {
    setFilterDropdownOpen((prev) =>
      prev.map((val, i) => (i === colIndex ? !val : false))
    );
  };

  // When a user toggles a checkbox for a column:
  const toggleFilterValue = (colIndex, value) => {
    setFilterCustomized((prev) => {
      const newCustomized = [...prev];
      newCustomized[colIndex] = true;
      return newCustomized;
    });
    setFilterValues((prev) => {
      const newFilters = [...prev];
      let currentSet = newFilters[colIndex]
        ? new Set(newFilters[colIndex])
        : new Set();
      if (currentSet.has(value)) {
        currentSet.delete(value);
      } else {
        currentSet.add(value);
      }
      newFilters[colIndex] = currentSet;
      return newFilters;
    });
  };

  // Select or unselect all values for a given column.
  const selectAllValuesForColumn = (colIndex, selectAll) => {
    setFilterCustomized((prev) => {
      const newCustomized = [...prev];
      newCustomized[colIndex] = true;
      return newCustomized;
    });
    setFilterValues((prev) => {
      const newFilters = [...prev];
      newFilters[colIndex] = selectAll
        ? new Set(distinctValuesByCol[colIndex])
        : new Set();
      return newFilters;
    });
  };

  // Update a cell’s value.
  // If the column is unfiltered (not customized), auto-update the filter options.
  const handleCellChange = (rowIndex, colIndex, e) => {
    const newValue = e.target.value;
    dispatch(updateCell({ rowIndex, colIndex, value: newValue }));
    if (rowIndex > 0 && !filterCustomized[colIndex]) {
      setFilterValues((prev) => {
        const newFilters = [...prev];
        let current = newFilters[colIndex]
          ? new Set(newFilters[colIndex])
          : new Set();
        current.add(newValue);
        newFilters[colIndex] = current;
        return newFilters;
      });
    }
  };

  const handleAddRow = () => {
    dispatch(addRow());
    // For each unfiltered column, add the new (empty) value.
    setFilterValues((prev) => {
      const newFilters = [...prev];
      newFilters.forEach((filterSet, colIndex) => {
        if (!filterCustomized[colIndex]) {
          const newSet = new Set(filterSet);
          newSet.add("");
          newFilters[colIndex] = newSet;
        }
      });
      return newFilters;
    });
  };

  const handleAddColumn = () => {
    dispatch(addColumn());
    setFilterValues((prev) => [...prev, new Set()]);
    setFilterCustomized((prev) => [...prev, false]);
    setFilterDropdownOpen((prev) => [...prev, false]);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const importedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (importedData && importedData.length > 0) {
        dispatch(setData(importedData));
      }
    };
    reader.readAsBinaryString(file);
  };

  // Column resizing handler.
  const handleMouseDown = (e, colIndex) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colIndex];
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      let newWidth = startWidth + delta;
      if (newWidth < 30) newWidth = 30;
      dispatch(setColumnWidth({ colIndex, width: newWidth }));
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Compute row indices that pass the filter.
  const filteredRowIndices = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let include = true;
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      if (filterValues[colIndex] && filterValues[colIndex].size > 0) {
        if (!filterValues[colIndex].has(row[colIndex])) {
          include = false;
          break;
        }
      }
    }
    if (include) {
      filteredRowIndices.push(i);
    }
  }

  return (
    <div className="h-screen p-4">
      {/* ACTION BUTTONS */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={handleAddRow}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Row
        </button>
        <button
          onClick={handleAddColumn}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Column
        </button>
        <input
          type="file"
          accept=".xlsx, .xls"
          ref={fileInputRef}
          onChange={handleImport}
          style={{ display: "none" }}
        />
      </div>

      {/* SCROLLABLE CONTAINER */}
      <div className="border h-[80vh] border-gray-300 shadow-md rounded-md w-full overflow-x-auto overflow-y-auto">
        <table
          className="border-collapse table-fixed text-sm"
          style={{ minWidth: "max-content" }}
        >
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr>
              {data[0].map((header, colIndex) => (
                <th
                  key={colIndex}
                  className="relative border border-gray-300 text-left align-middle p-2"
                  style={{ width: columnWidths[colIndex], minWidth: 30 }}
                >
                  <div className="flex items-center">
                    <input
                      className="flex-grow bg-transparent font-semibold focus:outline-none"
                      value={header}
                      onChange={(e) => handleCellChange(0, colIndex, e)}
                    />
                    <button
                      onClick={() => toggleFilterDropdown(colIndex)}
                      className="ml-2 px-2 py-1 border border-gray-400 rounded text-xs hover:bg-gray-200"
                    >
                      ▼
                    </button>
                  </div>
                  <div
                    className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize bg-gray-400 hover:bg-gray-600 z-20"
                    onMouseDown={(e) => handleMouseDown(e, colIndex)}
                  />
                  {filterDropdownOpen[colIndex] && (
                    <div
                      className="absolute bg-white border border-gray-300 p-2 mt-1 z-50"
                      style={{ right: 0, top: "100%", width: 220 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Filter</span>
                        <button
                          className="text-xs bg-gray-200 px-1 rounded"
                          onClick={() => toggleFilterDropdown(colIndex)}
                        >
                          Close
                        </button>
                      </div>
                      <div className="flex gap-2 mb-2">
                         
                      </div>
                      <div className="max-h-40 overflow-auto border-t border-gray-200 pt-2">
                        {Array.from(distinctValuesByCol[colIndex]).map(
                          (val) => (
                            <label
                              key={val}
                              className="flex items-center gap-2 text-sm mb-1"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  filterValues[colIndex]?.has(val) || false
                                }
                                onChange={() =>
                                  toggleFilterValue(colIndex, val)
                                }
                              />
                              <span>{val}</span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRowIndices.map((rowIndex) => (
              <tr key={rowIndex} className="border hover:bg-gray-50">
                {data[rowIndex].map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="border p-1"
                    style={{ width: columnWidths[colIndex] }}
                  >
                    <input
                      className="w-full bg-transparent focus:outline-none"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
