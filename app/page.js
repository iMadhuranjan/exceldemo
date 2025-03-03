'use client'
import { Provider } from "react-redux";
import Spreadsheet from "./SpreedSheet";
import { store } from "./store";


export default function Home() {
  return (
    <div>
      <p className="text-3xl font-bold my-3"> Google Sheet</p>
      <Provider store={store}>
        <Spreadsheet />
      </Provider>

    </div>
  );
}
