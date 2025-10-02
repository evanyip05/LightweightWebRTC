/* SHEETS constANTS / constIABLES */

const id = "1aKyiku7CpHiqMwdLudsTov8Qvx9r0PLbzVBBdE_ZtPc"
const ss = SpreadsheetApp.openById(id)

/* SPREADSHEET APP FUNCTIONS */
function test() {
  console.log(xyToA1(ss.getLastColumn(), 0))
  // console.log(ss.insertColumnBefore(1))
  console.log(ss.getLastColumn())
  console.log(ss.getLastRow())
  // insertRow("Sheet1",5)
  writeCell("Bookmarks","A1","word")
}

function getLastColumn(sheet) {
  ss.setActiveSheet(ss.getSheetByName(sheet))
  return ss.getLastColumn()
}

function getLastRow(sheet) {
  ss.setActiveSheet(ss.getSheetByName(sheet))
  return ss.getLastRow()
}

function insertRow(sheet, row) {
  ss.getSheetByName(sheet).insertRowAfter(row)
}





/* SHEETS API FUNCTIONS */

// function appendToRow(sheet, col)

// please only use col lttr eg:A or B etc...
function appendToCol(sheet, col, value) {
  // let valueRange = Sheets.newRowData();
  // valueRange.values = [[value]];

  // return Sheets.Spreadsheets.Values.append(valueRange, id, sheet+"!"+col, {valueInputOption: "USER_ENTERED"});

  return writeCell(sheet, col+(readCol(sheet,col).length+1), value)
}

// please only use cell num eg:A1 or B6 etc...
function writeCell(sheet, cell, value) {
  let valueRange = Sheets.newValueRange();
  valueRange.values = [[value]];
  try {
    Sheets.Spreadsheets.Values.update(valueRange, id, sheet+"!"+cell, {valueInputOption: "USER_ENTERED"})
    return "OK"
  } catch (err) {
    return "ERROR " + err
  }
  // return Sheets.Spreadsheets.Values.update(valueRange, id, sheet+"!"+cell, {valueInputOption: "USER_ENTERED"})
}

// please only use cell num eg:A1 or B6 etc...
function readCell(sheet, cell) {
  return Sheets.Spreadsheets.Values.get(id, sheet+"!"+cell).values
} 

// please only use col lttr eg:A or B etc...
function readCol(sheet, col) {
  console.log('readCol', arguments)
  const column = Sheets.Spreadsheets.Values.get(id, sheet+"!"+col+":"+col).values

  return column === undefined?[]:column.map(v => v[0]===undefined?"":v[0])
}

// be careful with this one... A1 notation
function readRange(sheet, range) {
  const res = Sheets.Spreadsheets.Values.get(id, sheet+"!"+range, {majorDimension:"COLUMNS"}).values
  return res===undefined?[[]]:res
}

/*
be super duper careful
expected range - cellTL:cellBR
!noWrap -> values.map(v => [v]) cause its stupid like that
*/
function writeCells(sheet, range, values, noWrap) {
  console.log('writeCells', range, values)
  if (!noWrap) {
    values = values.map(v=>[v])
  }
  const check = checkCells(range, values)
  if (check !== "OK") {
    return check
  }
  let valueRange = Sheets.newValueRange();
  valueRange.values = values;

  try {
    Sheets.Spreadsheets.Values.update(valueRange, id, sheet+"!"+range, {valueInputOption: "USER_ENTERED"})
    return "OK"
  } catch (err) {
    return "ERROR " + err
  }
}





/* SHEETS UTILS */

function checkCells(range, cells) {
  // make a way to query these
  const verbose = true
  const maxWidth = 26
  const maxHeight = 1000

  const rangeSplit = range.split(":")
  const tlxy = a1ToXy(rangeSplit[0])
  const brxy = a1ToXy(rangeSplit[1])

  log(verbose, "tlxy:", tlxy, "brxy:" ,brxy)

  if (brxy.x + 1 > maxWidth) {
    return "ERROR RANGE W OOB brX: " + (brxy.x + 1) + " vs maxX: " + maxWidth 
  } else if (brxy.y + 1 > maxHeight) {
    return "ERROR RANGE H OOB brY: " + (brxy.y + 1) + " vs maxY: " + maxHeight
  }

  const width =  (brxy.x - tlxy.x) + 1
  const height = (brxy.y - tlxy.y) + 1 

  let colsOK = cells.length == height;
  let rowsOK = true;
  
  let errorWidth = -1
  cells.forEach(row => {
    if (row.length != width) {
      if (errorWidth == -1) {
        errorWidth = row.length
      }
      rowsOK = false
    }
  }) 

  log(verbose, "rangeWidth:", width, "rangeHeight:", height)
  log(verbose, "cellWidth:", cells[0].length, "cellHeight:", cells.length)

  if (!rowsOK) {
    return "ERROR CELLS R OOB cellWidth: " +  errorWidth + " vs rangeWidth: " + width
  } else if (!colsOK) {
    return "ERROR CELLS C OOB cellHeight: " + cells.length + " vs rangeHeight: " + height 
  }

  return "OK"
}

// function topLeftCellsToRange(x,y,cells) {
//   if (!cells[0].length) {
//     return "ERROR MISSING ROWS"
//   }
// }

// w,h need to be at least 1x1
function topLeftToRange(x,y,w,h) {
  if (w < 1) {
    return "ERROR W < 1"
  } else if (h < 1) {
    return "ERROR H < 1"
  }
  return coordsToRange(x,y,(x-1)+w,(y-1)+h)
}

/*
takes non indicies
make sure xy2 > xy1
*/
function coordsToRange(x1,y1,x2,y2) {
  return xyToA1(x1-1,y1-1)+":"+xyToA1(x2-1,y2-1)
}

// returns indicies
function a1ToXy(a1) {
  const columnChars = a1.match(/[A-Z]+/)[0];
  const rowNum = parseInt(a1.match(/\d+/)[0], 10);

  let colNum = 0;
  for (let i = 0; i < columnChars.length; i++) {
    colNum = colNum * 26 + (columnChars.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }

  return { x: colNum - 1, y: rowNum - 1 };
}

// takes indicies 
function xyToA1(x, y) {
  return colNumberToLetter(x) + (y + 1);
}

function colLetterToNumber(col) {
  let colNum = 0;
  for (let i = 0; i < col.length; i++) {
    colNum = colNum * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return colNum
}

function colNumberToLetter(x) {
  let columnLetter = '';
  while (x >= 0) {
    columnLetter = String.fromCharCode(65 + (x % 26)) + columnLetter;
    x = Math.floor(x / 26) - 1;
  }
  return columnLetter;
}
