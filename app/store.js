"use client"
import { configureStore } from '@reduxjs/toolkit';
import spreadsheetReducer from './SpreedSlice';

export const store = configureStore({
    reducer: {
        spreadsheet: spreadsheetReducer,
    },
});
