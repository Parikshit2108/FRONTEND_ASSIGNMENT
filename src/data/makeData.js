import { faker } from "@faker-js/faker";

export function makeData(rowCount = 2000, colCount = 80) {
  const columns = Array.from({ length: colCount }, (_, i) => ({
    header: `Col ${i + 1}`,
    accessorKey: `col${i + 1}`,
  }));
  const data = Array.from({ length: rowCount }, () => {
    const row = {};
    for (let i = 0; i < colCount; i++) {
      row[`col${i + 1}`] = faker.word.noun();
    }
    return row;
  });

  return { columns, data };
}
