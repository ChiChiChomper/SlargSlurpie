const board = document.getElementById('chessboard');
let selectedPiece = null;
let selectedSquare = null;

// Unicode chess pieces
const initialBoard = [
  ["♜","♞","♝","♛","♚","♝","♞","♜"],
  ["♟","♟","♟","♟","♟","♟","♟","♟"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["♙","♙","♙","♙","♙","♙","♙","♙"],
  ["♖","♘","♗","♕","♔","♗","♘","♖"]
];

function createBoard() {
  board.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
      square.dataset.row = row;
      square.dataset.col = col;

      const piece = initialBoard[row][col];
      if (piece) {
        square.textContent = piece;
        square.classList.add('piece');
      }

      square.addEventListener('click', handleClick);
      board.appendChild(square);
    }
  }
}

function handleClick(e) {
  const square = e.currentTarget;
  const row = square.dataset.row;
  const col = square.dataset.col;

  if (selectedPiece) {
    // Move piece
    const target = square;
    if (target.textContent === '' || isOpponentPiece(selectedPiece, target.textContent)) {
      initialBoard[target.dataset.row][target.dataset.col] = selectedPiece;
      initialBoard[selectedSquare.dataset.row][selectedSquare.dataset.col] = '';
    }
    selectedPiece = null;
    selectedSquare = null;
    createBoard();
  } else if (square.textContent !== '') {
    // Select piece
    selectedPiece = square.textContent;
    selectedSquare = square;
  }
}

function isOpponentPiece(p1, p2) {
  return (p1.charCodeAt(0) < 9812 && p2.charCodeAt(0) >= 9812) || 
         (p1.charCodeAt(0) >= 9812 && p2.charCodeAt(0) < 9812);
}

createBoard();
