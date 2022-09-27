'use strict'

const BEGGINER_SIZE = 4
const MEDIUM_SIZE = 8
const EXPERT_SIZE = 12

const BEGGINER_MINES = 2
const MEDIUM_MINES = 14
const EXPERT_MINES = 32

const MINE = '💣'
const MARK = '🚩'
const EMPTY = ''

const SUCCESS = 'Well Done! You Won!'
const FAILURE = 'Game Over'
const SAD_EMOJI = `🙁`
const HAPPY_EMOJI = `🙂`
const WINNER_EMOJI = `😎`

const HINT_SIGN = '💡'
const HINTS_NUM = 3

const LIFE_SIGN = '❤'
const LIVES_NUM = 3

const SAFE_CLICKS_NUM = 3

var gBoard = []
var gLevel = { SIZE: BEGGINER_SIZE, MINES: BEGGINER_MINES }
var gGame
var gTimeInterval
var gHintIsOn
var gIsFirstClick
var gLives
var gSafeClickCount

function initGame() {
    // Model
    gBoard = buildBoard()
    gGame = { isOn: true, shownCount: 0, markedCount: 0, secsPassed: 0 }
    gHintIsOn = false
    gIsFirstClick = true
    gLives = LIVES_NUM
    gSafeClickCount = SAFE_CLICKS_NUM

    // DOM
    renderBoard()
    renderLives()

    var elGameOver = document.querySelector('.game-over')
    elGameOver.innerHTML = ''

    var elEmoji = document.querySelector('.emoji')
    elEmoji.innerText = HAPPY_EMOJI

    var elLeftMines = document.querySelector('.left-mines')
    elLeftMines.innerText = gLevel.MINES

    var elTime = document.querySelector('.time')
    elTime.innerText = 0

    var elHints = document.querySelector('.hints')
    elHints.innerHTML = ''
    for (var i = 0; i < HINTS_NUM; i++) {
        elHints.innerHTML += `<span class="hint-${i}" 
        onClick="useHint(${i})">${HINT_SIGN}</span>`
    }

    var elSafeClicksNum = document.querySelector('.safe-clicks-num')
    elSafeClicksNum.innerText = gSafeClickCount

    clearInterval(gTimeInterval)
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
    if (!gGame.isOn || currCell.isShown || (currCell.isMarked && !gHintIsOn))
        return

    if (gIsFirstClick) {
        firstClick(i, j)
        gIsFirstClick = false
    }

    if (gHintIsOn) {
        showHint(i, j)
    }

    if (!currCell.isMine && currCell.minesAround === 0 && !gHintIsOn) {
        expandShown(elCell, i, j)
        return
    }

    // Model
    currCell.isShown = true
    if (!gHintIsOn) {
        gGame.shownCount++
        if (currCell.isMine) {
            gGame.markedCount++
            gLives--
        }
    }

    // DOM
    var value = currCell.minesAround
    if (currCell.isMine) {
        value = MINE
        if (currCell.isMine && !gHintIsOn) {
            var elLeftMines = document.querySelector('.left-mines')
            elLeftMines.innerText = +elLeftMines.innerText - 1
        }
    } else if (value === 0) value = EMPTY
    elCell.innerText = value
    elCell.style.backgroundColor = currCell.isMine
        ? 'red'
        : 'rgb(183, 196, 207, 0.485)'

    checkGameOver(currCell.isMine ? FAILURE : SUCCESS)
}

function firstClick(rowIdx, colIdx) {
    // Running the time interval
    gTimeInterval = setInterval(runTime, 1000)

    // Placing mines on the board

    // Model
    for (var k = 0; k < gLevel.MINES; k++) {
        var i = getRandomInt(0, gLevel.SIZE)
        var j = getRandomInt(0, gLevel.SIZE)
        while (gBoard[i][j].isMine || (i === rowIdx && j === colIdx)) {
            var i = getRandomInt(0, gLevel.SIZE)
            var j = getRandomInt(0, gLevel.SIZE)
        }
        gBoard[i][j].isMine = true
    }

    // DOM
    gBoard = setMinesNegsCount(gBoard)
    renderBoard()

    // Fixing the first-clicked cell (DOM)
    var elCurrCell = document.querySelector(`.cell-${rowIdx}-${colIdx}`)
    elCurrCell.style.backgroundColor = 'rgb(183, 196, 207, 0.485)'
    var value = gBoard[rowIdx][colIdx].minesAround
    if (value > 0) elCurrCell.innerText = value
}

function cellMarked(elCell, i, j) {
    if (!gGame.isOn || gBoard[i][j].isShown) return

    // Model
    var currCell = gBoard[i][j]
    currCell.isMarked = !currCell.isMarked
    if (currCell.isMarked) {
        gGame.markedCount++
        checkGameOver(SUCCESS)
    } else gGame.markedCount--

    // DOM
    elCell.innerText = currCell.isMarked ? MARK : EMPTY
    var change = currCell.isMarked ? -1 : 1
    var elLeftMines = document.querySelector('.left-mines')
    elLeftMines.innerText = +elLeftMines.innerText + change
}

function checkGameOver(successOrFailure) {
    if (
        (gGame.shownCount + gGame.markedCount - (LIVES_NUM - gLives) !==
            gLevel.SIZE ** 2 ||
            gGame.markedCount !== gLevel.MINES) &&
        (successOrFailure !== FAILURE || gHintIsOn)
    )
        return
    // Model
    gGame.isOn = false

    // DOM
    var elEmoji = document.querySelector('.emoji')
    if (successOrFailure === FAILURE && !gHintIsOn) {
        if (gLives > 0) {
            gGame.isOn = true
            renderLives(gLives)
            checkGameOver(SUCCESS)
            return
        }
        elEmoji.innerText = SAD_EMOJI
        revealMines()
    } else if (successOrFailure === SUCCESS) {
        elEmoji.innerText = WINNER_EMOJI
    }
    if (gLives === 0) renderLives(0)

    var elGameOver = document.querySelector('.game-over')
    elGameOver.innerHTML = `<h2 class="delete-at-restart">${successOrFailure}</h2>`

    clearInterval(gTimeInterval)
}

function revealMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j].isMine) {
                // Model
                gBoard[i][j].isShown = true

                // DOM
                var elCurrMine = document.querySelector(`.cell-${i}-${j}`)
                elCurrMine.innerText = MINE
            }
        }
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

    checkGameOver(SUCCESS)

    // Stopping condition
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

function runTime() {
    // Model
    gGame.secsPassed++

    // DOM
    var elTime = document.querySelector('.time')
    elTime.innerText = gGame.secsPassed
}

function changeLevel(level) {
    switch (level) {
        case 1:
            gLevel = { SIZE: BEGGINER_SIZE, MINES: BEGGINER_MINES }
            break
        case 2:
            gLevel = { SIZE: MEDIUM_SIZE, MINES: MEDIUM_MINES }
            break
        case 3:
            gLevel = { SIZE: EXPERT_SIZE, MINES: EXPERT_MINES }
            break
    }
    initGame()
}

function useHint(hintIdx) {
    if (!gGame.isOn) return

    // Model
    gHintIsOn = true

    // DOM
    var elHintSign = document.querySelector(`.hint-${hintIdx}`)
    elHintSign.style.display = 'none'
}

function showHint(rowIdx, colIdx) {
    var cells = []
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue

            var currCell = gBoard[i][j]
            if (!currCell.isShown) {
                // Model
                currCell.isShown = true

                // DOM
                var elCurrCell = document.querySelector(`.cell-${i}-${j}`)
                var value = currCell.minesAround
                if (currCell.isMine) value = MINE
                else if (currCell.minesAround === 0) value = EMPTY
                elCurrCell.innerText = value

                elCurrCell.style.backgroundColor = 'rgb(183, 196, 207)'

                cells.push({ i, j })
            }
        }
    }
    setTimeout(hideHintCells, 1000, cells)
}

function hideHintCells(cells) {
    gHintIsOn = false
    for (var cellIdx = 0; cellIdx < cells.length; cellIdx++) {
        var i = cells[cellIdx].i
        var j = cells[cellIdx].j

        // Model
        gBoard[i][j].isShown = false

        // DOM
        var elCurrCell = document.querySelector(`.cell-${i}-${j}`)
        elCurrCell.innerText = gBoard[i][j].isMarked ? MARK : EMPTY
        elCurrCell.style.backgroundColor = 'rgb(215, 192, 174)'
    }
}

function findSafeClick() {
    if (gSafeClickCount === 0 || !gGame.isOn) return

    // Finding a safe click
    var safeClicks = getSafeClicks()
    if (safeClicks.length === 0) return
    var idx = getRandomInt(0, safeClicks.length)
    var i = safeClicks[idx].i
    var j = safeClicks[idx].j

    // Model
    gSafeClickCount--

    // DOM
    var elSafeClicksNum = document.querySelector('.safe-clicks-num')
    elSafeClicksNum.innerText = gSafeClickCount

    var elCurrCell = document.querySelector(`.cell-${i}-${j}`)
    elCurrCell.classList.add('safe-click')

    setTimeout(() => {
        elCurrCell.classList.add('back-from-safe-click')
    }, 3000)
}

function getSafeClicks() {
    var safeclicks = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (!currCell.isMarked && !currCell.isShown && !currCell.isMine) {
                safeclicks.push({ i, j })
            }
        }
    }
    return safeclicks
}

function renderLives() {
    var elLives = document.querySelector('.lives')
    elLives.innerText = ''
    for (var i = 0; i < gLives; i++) {
        elLives.innerHTML += `<span class="life-${i}" style="color: red">
        ${LIFE_SIGN}</span>`
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)
}
