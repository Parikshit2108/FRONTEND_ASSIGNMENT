import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {FaEye, FaEyeSlash, FaCog } from "react-icons/fa";
import ReusableButton from "@component/ReusableButton/ReusableButton";
import { FaArrowLeft, FaArrowRight, FaTimes } from "react-icons/fa";
import { TABLE_STRINGS } from "@constants/tableStrings";

export default function DataTable({
  columns: userColumns,
  data,
  title,
  enableVirtualization = false,
  enableColumnResizing = false,
  enablePinning = false,
  enableDragDrop = false,
  showSettingsDropdown = false,
  rowHeight = 44,
  overscan = 8,
}) {
    const tableContainerRef = useRef(null);
    const [settingsOpen, setSettingsOpen] = useState(false);


    const initialColumnSizes = useMemo(() => {
        const sizes = {};
        userColumns.forEach((col) => {
            sizes[col.id ?? (col.accessorKey ?? col.header ?? "")] = col.size ?? 160;
        });
        return sizes;
    }, [userColumns]);

    const [columnSizes, setColumnSizes] = useState(initialColumnSizes);

    const columns = useMemo(() => {
        return userColumns.map((col) => {
            const id = col.id ?? (col.accessorKey ?? col.header ?? "");
            return {
                ...col,
                size: columnSizes[id] ?? 160,
                enableResizing: enableColumnResizing,
                getCanPin: () => enablePinning,
            };
        });
    }, [userColumns, columnSizes, enableColumnResizing, enablePinning]);

    const initialOrder = useMemo(
        () =>
            columns.map((c) => c.id ?? (c.accessorKey ? String(c.accessorKey) : c.header ?? "")),
        [columns]
    );

    const [columnOrder, setColumnOrder] = useState(initialOrder);

    const table = useReactTable({
        data,
        columns,
        state: {
            columnOrder,
            columnSizing: columnSizes,
        },
        onColumnOrderChange: setColumnOrder,
        onColumnSizingChange: setColumnSizes,
        getCoreRowModel: getCoreRowModel(),
        columnResizeMode: "onChange",
    });

    // No column virtualization

    useEffect(() => {
        const allIds = table.getAllLeafColumns().map((c) => c.id);
        if (JSON.stringify(allIds) !== JSON.stringify(columnOrder)) {
            setColumnOrder(allIds);
        }
    }, [table, columnOrder]);

    const sensors = useSensors(useSensor(PointerSensor));

    const rowVirtualizer = useVirtualizer({
      count: table.getRowModel().rows.length,
      getScrollElement: () => tableContainerRef.current,
      estimateSize: () => rowHeight,
      overscan,
    });

    let virtualRows = [];
    let totalSize = data?.length || 0;
    if (enableVirtualization) {
      virtualRows = rowVirtualizer.getVirtualItems();
      totalSize = rowVirtualizer.getTotalSize();
    } else {
      virtualRows = table.getRowModel().rows.map((_, idx) => ({
        index: idx,
        start: idx * rowHeight,
      }));
      totalSize = table.getRowModel().rows.length * rowHeight;
    }

    const { leftOffsets, rightOffsets } = useMemo(() => {
        const leftCols = table.getLeftLeafColumns();
        const rightCols = table.getRightLeafColumns();

        const leftOffsetsMap = {};
        let acc = 0;
        for (const c of leftCols) {
            leftOffsetsMap[c.id] = acc;
            const w = c.getSize ? c.getSize() : 160;
            acc += w;
        }

        const rightOffsetsMap = {};
        acc = 0;
        for (let i = rightCols.length - 1; i >= 0; i--) {
            const c = rightCols[i];
            rightOffsetsMap[c.id] = acc;
            const w = c.getSize ? c.getSize() : 160;
            acc += w;
        }
        return { leftOffsets: leftOffsetsMap, rightOffsets: rightOffsetsMap };
    }, [table, columnOrder, data]);

    const handleDragEnd = useCallback((event) => {
        if (!enableDragDrop) return;
        const { active, over } = event;
        if (!over || !active) return;
        if (active.id === over.id) return;

        const activeId = active.id;
        const overId = over.id;

        const leftIds = table.getLeftLeafColumns().map((c) => c.id);
        const centerIds = table.getCenterLeafColumns().map((c) => c.id);
        const rightIds = table.getRightLeafColumns().map((c) => c.id);

        const regionOf = (id) => {
            if (leftIds.includes(id)) return "left";
            if (rightIds.includes(id)) return "right";
            return "center";
        };

        const region = regionOf(activeId);
        const targetRegion = regionOf(overId);

        if (region !== targetRegion) return;

        let regionIds;
        if (region === "left") regionIds = leftIds;
        else if (region === "right") regionIds = rightIds;
        else regionIds = centerIds;

        const oldIndex = regionIds.indexOf(activeId);
        const newIndex = regionIds.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return;

        const reorderedRegion = arrayMove(regionIds, oldIndex, newIndex);

        const finalOrder = [
            ...(region === "left" ? reorderedRegion : leftIds),
            ...(region === "center" ? reorderedRegion : centerIds),
            ...(region === "right" ? reorderedRegion : rightIds),
        ];

        setColumnOrder(finalOrder);
    }, [table, enableDragDrop]);

    function SortableHeader({ header }) {
        const column = header.column;
        const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
            id: column.id,
        });

        const pinned = column.getIsPinned();
        const canPin = typeof column.getCanPin === 'function' ? column.getCanPin() : false;

        const size = column.getSize ? column.getSize() : 160;
        const style = {
            transform: CSS.Translate.toString(transform),
            transition: "width 150ms ease, transform 150ms ease",
            opacity: isDragging ? 0.85 : 1,
            whiteSpace: "nowrap",
            width: `${size}px`,
            minWidth: `${size}px`,
            maxWidth: `${size}px`,
            zIndex: pinned ? 20 : 1,
            ...(pinned === "left"
                ? {
                    position: "sticky",
                    left: leftOffsets[column.id] ?? 0,
                    boxShadow: "2px 0 5px rgba(0,0,0,0.04)",
                    background: "white",
                }
                : {}),
            ...(pinned === "right"
                ? {
                    position: "sticky",
                    right: rightOffsets[column.id] ?? 0,
                    boxShadow: "-2px 0 5px rgba(0,0,0,0.04)",
                    background: "white",
                }
                : {}),
        };

        return (
            <th
                ref={setNodeRef}
                style={style}
                className="px-3 py-2 border-r border-b border-gray-300 text-left align-middle relative"
            >
                <div className="flex items-center gap-2">
                    <div className="flex-1 text-sm font-medium">
                        {header.isPlaceholder
                            ? null
                            : flexRender(column.columnDef.header, header.getContext())}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={column.getToggleVisibilityHandler()}
                            className={`p-1 rounded ${column.getIsVisible() ? "text-blue-600" : "text-gray-400"}`}
                            title={column.getIsVisible() ? TABLE_STRINGS.HIDE_COLUMN : TABLE_STRINGS.SHOW_COLUMN}
                        >
                            {column.getIsVisible() ? <FaEye /> : <FaEyeSlash />}
                        </button>

                        {enablePinning && canPin && pinned !== "left" && (
                            <button
                                className="p-1 rounded border"
                                title={TABLE_STRINGS.PIN_LEFT}
                                onClick={() => column.pin("left")}
                            >
                                <FaArrowLeft color="#2563eb" size={14} />
                            </button>
                        )}
                        {enablePinning && canPin && pinned && (
                            <button
                                className="p-1 rounded border"
                                title={TABLE_STRINGS.UNPIN}
                                onClick={() => column.pin(false)}
                            >
                                <FaTimes color="#dc2626" size={18} />
                            </button>
                        )}
                        {enablePinning && canPin && pinned !== "right" && (
                            <button
                                className="p-1 rounded border"
                                title={TABLE_STRINGS.PIN_RIGHT}
                                onClick={() => column.pin("right")}
                            >
                                <FaArrowRight color="#2563eb" size={14} />
                            </button>
                        )}

                        {enableDragDrop && (
                            <button
                                {...attributes}
                                {...listeners}
                                className="p-1 rounded cursor-grab"
                                title={TABLE_STRINGS.DRAG_TO_REORDER}
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden
                                >
                                    <path d="M7 4h2v2H7zm0 4h2v2H7zm0 4h2v2H7zM11 4h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {enableColumnResizing && typeof column.getCanResize === 'function' && column.getCanResize() && (
                    <div
                        onPointerDown={header.getResizeHandler()}
                        onClick={(e) => e.stopPropagation()}
                        className="resizer"
                        style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            height: "100%",
                            width: "6px",
                            cursor: "col-resize",
                            userSelect: "none",
                            touchAction: "none",
                            zIndex: 10,
                        }}
                    />
                )}

            </th>
        );
    }



    const getCellStyle = (cell) => {
        const pinned = cell.column.getIsPinned();
        const size = cell.column.getSize ? cell.column.getSize() : 160;
        const base = {
            padding: "10px 12px",
            borderBottom: "1px solid #ccc",
            borderRight: "1px solid #ccc",
            minWidth: `${size}px`,
            maxWidth: `${size}px`,
            width: `${size}px`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            background: "transparent",
        };
        if (pinned === "left") {
            return {
                ...base,
                position: "sticky",
                left: leftOffsets[cell.column.id] ?? 0,
                zIndex: 15,
                background: "white",
                boxShadow: "2px 0 5px rgba(0,0,0,0.04)",
            };
        } else if (pinned === "right") {
            return {
                ...base,
                position: "sticky",
                right: rightOffsets[cell.column.id] ?? 0,
                zIndex: 15,
                background: "white",
                boxShadow: "-2px 0 5px rgba(0,0,0,0.04)",
            };
        }
        return base;
    };

    const leftIds = table.getLeftLeafColumns().map((c) => c.id);
    const centerIds = table.getCenterLeafColumns().map((c) => c.id);
    const rightIds = table.getRightLeafColumns().map((c) => c.id);

    return (
        <div className="p-4 bg-gray-50 rounded-lg shadow">
            <div className="flex items-center justify-between mb-3 relative">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                {showSettingsDropdown && (
                  <ReusableButton
                      onClick={() => setSettingsOpen((s) => !s)}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      title={TABLE_STRINGS.SETTINGS}
                      icon={<FaCog />}
                  >
                      {TABLE_STRINGS.SETTINGS}
                  </ReusableButton>
                )}

                {showSettingsDropdown && settingsOpen && (
                    <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 shadow-lg rounded p-3 max-h-[70vh] w-[90vw] max-w-[200px] min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-700">{TABLE_STRINGS.MANAGE_COLUMNS}</h4>
                            <button
                                className="p-1 rounded hover:bg-gray-200"
                                title={TABLE_STRINGS.CLOSE}
                                onClick={() => setSettingsOpen(false)}
                            >
                                <FaTimes size={18} color="#555" />
                            </button>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <button
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                                onClick={() => {
                                    const allVisible = table.getAllLeafColumns().every(col => col.getIsVisible());
                                    table.getAllLeafColumns().forEach(col => {
                                        col.toggleVisibility(!allVisible);
                                    });
                                    if (allVisible) {
                                        setSettingsOpen(false);
                                    }
                                }}
                            >
                                {table.getAllLeafColumns().every(col => col.getIsVisible()) ? TABLE_STRINGS.HIDE_ALL : TABLE_STRINGS.SHOW_ALL}
                            </button>
                            <button
                                className="px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs"
                                onClick={() => {
                                    table.getAllLeafColumns().forEach(col => {
                                        col.toggleVisibility(true);
                                    });
                                }}
                            >
                                {TABLE_STRINGS.RESET}
                            </button>
                        </div>
                        <div className="overflow-y-auto border rounded" style={{maxHeight: '40vh'}}>
                            {table.getAllLeafColumns().map((col) => (
                                <div
                                    key={col.id}
                                    className="flex items-center justify-between p-2 border-b border-gray-100"
                                >
                                    <label className="flex items-center gap-2 w-48 truncate text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={col.getIsVisible()}
                                            onChange={() => col.toggleVisibility()}
                                            title={col.getIsVisible() ? TABLE_STRINGS.HIDE_COLUMN : TABLE_STRINGS.SHOW_COLUMN}
                                        />
                                        {col.columnDef.header ?? col.id}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {table.getAllLeafColumns().every(col => !col.getIsVisible()) ? (
                <div className="flex items-center justify-center h-[300px] border border-gray-300 rounded bg-white shadow text-gray-500">
                    {TABLE_STRINGS.ALL_COLUMNS_HIDDEN}
                </div>
            ) : (
                <div
                    ref={tableContainerRef}
                    className="h-[540px] overflow-auto border border-gray-300 rounded bg-white shadow relative"
                >
                    {enableDragDrop ? (
                      <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                      >
                          <table className="border-collapse min-w-max text-sm w-full" style={{ tableLayout: "fixed" }}>
                              <thead className="sticky top-0 bg-gray-100 z-10 border-b border-gray-300">
                                  {table.getHeaderGroups().map((headerGroup) => (
                                      <tr key={headerGroup.id} className="bg-gray-100 border-green-100">
                                          <SortableContext
                                              items={leftIds}
                                              strategy={horizontalListSortingStrategy}
                                          >
                                              {headerGroup.headers
                                                  .filter((h) => h.column.getIsPinned() === "left")
                                                  .map((header) => (
                                                      <SortableHeader key={header.id} header={header} />
                                                  ))}
                                          </SortableContext>

                                          <SortableContext
                                              items={centerIds}
                                              strategy={horizontalListSortingStrategy}
                                          >
                                              {headerGroup.headers
                                                  .filter((h) => !h.column.getIsPinned())
                                                  .map((header) => (
                                                      <SortableHeader key={header.id} header={header} />
                                                  ))}
                                          </SortableContext>

                                          <SortableContext
                                              items={rightIds}
                                              strategy={horizontalListSortingStrategy}
                                          >
                                              {headerGroup.headers
                                                  .filter((h) => h.column.getIsPinned() === "right")
                                                  .map((header) => (
                                                      <SortableHeader key={header.id} header={header} />
                                                  ))}
                                          </SortableContext>
                                      </tr>
                                  ))}
                              </thead>

                              <tbody
                                  style={{
                                      height: `${totalSize}px`,
                                      position: "relative",
                                  }}
                              >
                                  {virtualRows.length === 0 || table.getRowModel().rows.length === 0 ? (
                                      <tr>
                                          <td colSpan={table.getAllLeafColumns().length} className="text-center py-8 text-gray-500">
                                              {TABLE_STRINGS.NO_DATA}
                                          </td>
                                      </tr>
                                  ) : (
                                      virtualRows.map((virtualRow) => {
                                          const row = table.getRowModel().rows[virtualRow.index];
                                          return (
                                              <tr
                                                  key={row.id}
                                                  className={`${virtualRow.index % 2 === 0 ? "bg-white" : "bg-gray-50"} absolute left-0 w-full table-fixed text-left border-b border-gray-300`}
                                                  style={{
                                                      position: "absolute",
                                                      top: 0,
                                                      left: 0,
                                                      transform: `translateY(${virtualRow.start}px)`,
                                                      width: "100%",
                                                      display: "table",
                                                      tableLayout: "fixed",
                                                      textAlign: "left",
                                                  }}
                                              >
                                                  {/* Pinned left cells */}
                                                  {row.getVisibleCells().filter(cell => cell.column.getIsPinned() === "left").map((cell) => (
                                                      <td key={cell.id} className="border-r border-gray-300 px-3 py-2 min-w-[80px] max-w-[320px] w-full overflow-hidden text-ellipsis whitespace-nowrap bg-transparent" style={getCellStyle(cell)}>
                                                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                      </td>
                                                  ))}
                                                  {row.getVisibleCells().filter(cell => !cell.column.getIsPinned()).map((cell) => (
                                                      <td key={cell.id} className="border-r border-gray-300 px-3 py-2 min-w-[80px] max-w-[320px] w-full overflow-hidden text-ellipsis whitespace-nowrap bg-transparent" style={getCellStyle(cell)}>
                                                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                      </td>
                                                  ))}
                                                  {/* Pinned right cells */}
                                                  {row.getVisibleCells().filter(cell => cell.column.getIsPinned() === "right").map((cell) => (
                                                      <td key={cell.id} className="border-r border-gray-300 px-3 py-2 min-w-[80px] max-w-[320px] w-full overflow-hidden text-ellipsis whitespace-nowrap bg-transparent" style={getCellStyle(cell)}>
                                                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                      </td>
                                                  ))}
                                              </tr>
                                          );
                                      })
                                  )}
                              </tbody>
                          </table>
                      </DndContext>
                    ) : (
                      <table className="border-collapse min-w-max text-sm w-full" style={{ tableLayout: "fixed" }}>
                          <thead className="sticky top-0 bg-gray-100 z-10 border-b border-gray-300">
                              {table.getHeaderGroups().map((headerGroup) => (
                                  <tr key={headerGroup.id} className="bg-gray-100 border-green-100">
                                      {headerGroup.headers
                                          .filter((h) => h.column.getIsPinned() === "left")
                                          .map((header) => (
                                              <SortableHeader key={header.id} header={header} />
                                          ))}
                                      {headerGroup.headers
                                          .filter((h) => !h.column.getIsPinned())
                                          .map((header) => (
                                              <SortableHeader key={header.id} header={header} />
                                          ))}
                                      {headerGroup.headers
                                          .filter((h) => h.column.getIsPinned() === "right")
                                          .map((header) => (
                                              <SortableHeader key={header.id} header={header} />
                                          ))}
                                  </tr>
                              ))}
                          </thead>

                          <tbody
                              style={{
                                  height: `${totalSize}px`,
                                  position: "relative",
                              }}
                          >
                              {virtualRows.length === 0 || table.getRowModel().rows.length === 0 ? (
                                  <tr>
                                      <td colSpan={table.getAllLeafColumns().length} className="text-center py-8 text-gray-500">
                                          {TABLE_STRINGS.NO_DATA}
                                      </td>
                                  </tr>
                              ) : (
                                  virtualRows.map((virtualRow) => {
                                      const row = table.getRowModel().rows[virtualRow.index];
                                      return (
                                          <tr
                                              key={row.id}
                                              className={`${virtualRow.index % 2 === 0 ? "bg-white" : "bg-gray-50"} absolute left-0 w-full table-fixed text-left border-b border-gray-300`}
                                              style={{
                                                  position: "absolute",
                                                  top: 0,
                                                  left: 0,
                                                  transform: `translateY(${virtualRow.start}px)`,
                                                  width: "100%",
                                                  display: "table",
                                                  tableLayout: "fixed",
                                                  textAlign: "left",
                                              }}
                                          >
                                              {/* Pinned left cells */}
                                              {row.getVisibleCells().filter(cell => cell.column.getIsPinned() === "left").map((cell) => (
                                                  <td key={cell.id} className="border-r border-gray-300 px-3 py-2 min-w-[80px] max-w-[320px] w-full overflow-hidden text-ellipsis whitespace-nowrap bg-transparent" style={getCellStyle(cell)}>
                                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                  </td>
                                              ))}
                                              {row.getVisibleCells().filter(cell => !cell.column.getIsPinned()).map((cell) => (
                                                  <td key={cell.id} className="border-r border-gray-300 px-3 py-2 min-w-[80px] max-w-[320px] w-full overflow-hidden text-ellipsis whitespace-nowrap bg-transparent" style={getCellStyle(cell)}>
                                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                  </td>
                                              ))}
                                              {/* Pinned right cells */}
                                              {row.getVisibleCells().filter(cell => cell.column.getIsPinned() === "right").map((cell) => (
                                                  <td key={cell.id} className="border-r border-gray-300 px-3 py-2 min-w-[80px] max-w-[320px] w-full overflow-hidden text-ellipsis whitespace-nowrap bg-transparent" style={getCellStyle(cell)}>
                                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                  </td>
                                              ))}
                                          </tr>
                                      );
                                  })
                              )}
                          </tbody>
                      </table>
                    )}
                </div>
            )}
        </div>
    );
}
