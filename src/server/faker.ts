import "server-only";

import { faker } from "@faker-js/faker";

// generates faker data depending on what the column type is (bulk action)
export function generateBulkFakerData(
  type: string,
  columnName: string,
  count: number,
) {
  const data: string[] = [];
  const lowerColumnName = columnName.toLowerCase();

  for (let i = 0; i < count; i++) {
    // Check column name first for special cases
    if (lowerColumnName === "notes") {
      data.push(faker.lorem.words({ min: 2, max: 3 }));
    } else if (lowerColumnName === "status") {
      data.push(
        faker.helpers.arrayElement([
          "Todo",
          "In Progress",
          "In Review",
          "Done",
        ]),
      );
    } else {
      // Then fall back to type
      switch (type) {
        case "string":
        case "text":
          data.push(faker.person.firstName());
          break;
        case "number":
          data.push(faker.number.int({ max: 1000 }).toString());
          break;
        case "boolean":
          data.push(faker.datatype.boolean().toString());
          break;
        default:
          data.push("");
      }
    }
  }
  return data;
}

// generates faker data depending on what the column type is (single return)
export function returnFakerData(type: string, colName: string): string {
  if (colName === "Status") {
    return faker.helpers.arrayElement([
      "Todo",
      "In Progress",
      "In Review",
      "Done",
    ]);
  }

  if (colName === "Notes") {
    return faker.helpers.arrayElement([
      faker.word.adjective(),
      `${faker.word.adjective()} ${faker.word.adjective()}`,
    ]);
  }

  if (colName === "Assignee" || colName === "Name") {
    return faker.person.fullName();
  }

  // Fall back to type-based generation for future added columns
  switch (type) {
    case "string":
      return faker.person.firstName();
    case "number":
      return String(faker.number.int({ min: 1, max: 1000 }));
    default:
      return "";
  }
}
