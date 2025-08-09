import React from 'react';
import DataTable from '@component/DataTable';
import { makeData } from '@data/makeData';

export default function App() {
  const { columns, data } = makeData();

  return (
    <div className="p-2">
      <DataTable
        columns={columns}
        data={data}
        title={"TanStack Virtualized Table"}
        enableVirtualization={true}
        enableColumnResizing={true}
        enablePinning={true}
        enableDragDrop={true}
        showSettingsDropdown={true}
        rowHeight={44}
        overscan={8}
      />
    </div>
  );
}
