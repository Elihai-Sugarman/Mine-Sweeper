'use strict'

const BEGGINER_SIZE = 4
const MEDIUM_SIZE = 8
const EXPERT_SIZE = 12

const BEGGINER_MINES = 2
const MEDIUM_MINES = 14
const EXPERT_MINES = 32

const MINE = '*'
const MARK = 'X'
const EMPTY = ''

const SUCCESS = 'Well Done! You Won!'
const FAILURE = 'Game Over'
const SAD_EMOJI = `U+1F614`

var gBoard = []
var gLevel = { SIZE: BEGGINER_SIZE, MINES: BEGGINER_MINES }
var gGame

function initGame() {
    var elGameOver = document.querySelector('.game-over')
    elGameOver.innerHTML = ''
    gBoard = buildBoard()
    gGame = { isOn: true, shownCount: 0, markedCount: 0, secsPassed: 0 }
    renderBoard()
}

function buildBoard() {
    var board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([])
        for (var j = 0; j < gLevel.SIZE; j++) {
            var currCell = {
                minesAround: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
            board[i].push(currCell)
        }
    }
    for (var k = 0; k < gLevel.MINES; k++) {
        var i = getRandomInt(0, gLevel.SIZE)
        var j = getRandomInt(0, gLevel.SIZE)
        while (board[i][j].isMine) {
            var i = getRandomInt(0, gLevel.SIZE)
            var j = getRandomInt(0, gLevel.SIZE)
        }
        board[i][j].isMine = true
    }
    return setMinesNegsCount(board)
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            if (!board[i][j].isMine) {
                board[i][j].minesAround = countMinesInNegs(board, i, j)
            }
        }
    }
    return board
}

function countMinesInNegs(board, rowIdx, colIdx) {
    var count = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            if (i === rowIdx && j === colIdx) continue

            if (board[i][j].isMine) {
                count++
            }
        }
    }
    return count
}

function renderBoard() {
    var strHTML = ''

    for (var i = 0; i < gBoard.length; i++) {
        strHTML += '\n<tr>\n'
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            strHTML += `\t<td onClick="cellClicked(this, ${i}, ${j})" 
                    oncontextMenu="cellMarked(this, ${i}, ${j})"
                    class="cell-${i}-${j}">`
            if (currCell.isShown) {
                if (currCell.isMine) strHTML += MINE
                else strHTML += currCell.minesAround
            } else if (currCell.isMarked) strHTML += MARK
            else strHTML += EMPTY

            strHTML += `</td>\n`
        }
        strHTML += '\n</tr>'
    }

    var elBoard = document.querySelector('table')
    elBoard.innerHTML = strHTML
}

function cellClicked(elCell, i, j) {
    var currCell = gBoard[i][j]
    if (!gGame.isOn || currCell.isShown || currCell.isMarked) return

    // if (gGame.shownCount === 0) {
    //     firstClick(i, j)
    // }

    // Model
    if (!currCell.isMine && currCell.minesAround === 0) {
        expandShown(elCell, i, j)
        return
    }

    currCell.isShown = true
    gGame.shownCount++

    // DOM
    var value = currCell.minesAround
    if (currCell.isMine) value = MINE
    else if (value === 0) value = EMPTY
    elCell.style.backgroundColor = currCell.isMine
        ? 'red'
        : 'rgb(183, 196, 207, 0.485)'
    elCell.innerText = value

    checkGameOver(currCell.isMine ? FAILURE : SUCCESS)
}

function firstClick(rowIdx, colIdx) {
    for (var k = 0; k < gLevel.MINES; k++) {
        var i = getRandomInt(0, gLevel.SIZE)
        var j = getRandomInt(0, gLevel.SIZE)
        while (gBoard[i][j].isMine || (i === rowIdx && j === colIdx)) {
            var i = getRandomInt(0, gLevel.SIZE)
            var j = getRandomInt(0, gLevel.SIZE)
        }
        gBoard[i][j].isMine = true
    }
    gBoard = setMinesNegsCount(gBoard)
    renderBoard()
    // for (var a = 0; a < gBoard.length; a++) {
    //     var str = ''
    //     for (var b = 0; b < gBoard[a].length; b++) {
    //         str += gBoard[a][b].isMine ? MARK : gBoard[a][b].minesAround
    //     }
    //     console.log(str)
    // }
}

function cellMarked(elCell, i, j) {
    if (gBoard[i][j].isShown) return

    // Model
    var currCell = gBoard[i][j]
    currCell.isMarked = !currCell.isMarked

    // DOM
    elCell.innerText = currCell.isMarked ? MARK : EMPTY

    if (currCell.isMarked) {
        gGame.markedCount++
        checkGameOver(SUCCESS)
    } else gGame.markedCount--
}

function checkGameOver(successOrFailure) {
    if (
        (gGame.shownCount + gGame.markedCount === gLevel.SIZE ** 2 &&
            gGame.markedCount === gLevel.MINES) ||
        successOrFailure === FAILURE
    ) {
        // Model
        gGame.isOn = false

        // DOM
        var body = document.querySelector('.game-over')
        body.innerHTML = `<h2 class="delete-at-restart">${successOrFailure}</h2>`
    }
}

function expandShown(elCell, rowIdx, colIdx) {
    var currCell = gBoard[rowIdx][colIdx]
    // Model
    currCell.isShown = true
    gGame.shownCount++

    // Dom
    var value = currCell.minesAround ? currCell.minesAround : EMPTY
    elCell.style.backgroundColor = 'rgb(183, 196, 207, 0.485)'
    elCell.innerText = value

    checkGameOver()

    // Stopping consition
    if (currCell.minesAround > 0) return

    // Recursion on all neighbours of currCell
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (i === rowIdx && j === colIdx) continue

            // Sending to recursion only the neighbours that weren't shown yet
            if (!gBoard[i][j].isShown) {
                var negCell = document.querySelector(`.cell-${i}-${j}`)
                expandShown(negCell, i, j)
            }
        }
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)
}
