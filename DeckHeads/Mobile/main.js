// VARIABLES
let draw = document.getElementById('draw');
let touch = { x: 0, y: 0, drag: false, target: null, lastX: 0, lastY: 0, shakeCount: 0, lastTap: 0 };
let deck = [];
let suits = ['♣︎', '♠', '♥', '♦'];
let highestZIndex = 0;
let selbox = { div: null, active: false, x: 0, y: 0 };
let shuffling = false;

// CLASSES
class Card {
  constructor(value) {
    this.value = value;
    this.selected = false;
    this.pos = { x: 0, y: 0 };
    this.offsetX = 0;
    this.offsetY = 0;
    this.div = this.createCardElement();
    
    deck.push(this);
    this.setPosition(50, 50);
  }

  createCardElement() {
    const div = document.createElement('div');
    div.classList.add('card');
    div.innerHTML = this.value;
    Object.assign(div.style, {
      position: 'absolute',
      zIndex: 0,
      color: 'black',
    });

    div.addEventListener('touchstart', (e) => this.onTouchStart(e));
    div.addEventListener('touchend', (e) => this.onTouchEnd(e));
    
    return div;
  }

  onTouchStart(e) {
    e.preventDefault();
    let currentTime = new Date().getTime();
    let tapLength = currentTime - touch.lastTap;
    touch.lastTap = currentTime;
    
    if (tapLength < 300 && tapLength > 0) {
      this.onDoubleTap(e);
      return;
    }
    
    touch.drag = true;
    touch.target = this;
    touch.x = e.touches[0].clientX;
    touch.y = e.touches[0].clientY;
    this.div.style.zIndex = ++highestZIndex;

    if (this.selected) {
      deck.forEach(card => {
        if (card.selected) {
          card.offsetX = card.pos.x - touch.x;
          card.offsetY = card.pos.y - touch.y;
        }
      });
    } else {
      this.offsetX = this.pos.x - touch.x;
      this.offsetY = this.pos.y - touch.y;
    }
  }

  onDoubleTap(e) {
    e.preventDefault();
    this.div.style.color = this.div.style.color === 'black' ? 'white' : 'black';
  }

  onTouchEnd() {
    touch.drag = false;
    touch.target = null;
  }

  setPosition(x, y) {
    this.pos.x = x;
    this.pos.y = y;
    Object.assign(this.div.style, {
      left: `${x}px`,
      top: `${y}px`
    });
  }
}

// FUNCTIONS
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function shuffleSelectedCards() {
  const selectedCards = deck.filter(card => card.selected);
  if (selectedCards.length > 0) {
    shuffling = true;
    selectedCards.forEach(card => {
      card.setPosition(touch.x, touch.y);
      card.div.style.zIndex = highestZIndex - rand(0, selectedCards.length);
      card.div.style.color = 'black';
    });
  }
}

function init() {
  let saveddeck = JSON.parse(localStorage.getItem('deck'));

  if (saveddeck != null) {
    deck = saveddeck.map(cardData => {
      let card = new Card(cardData.value);
      card.setPosition(cardData.pos.x, cardData.pos.y);
      return card;
    });
  }

  deck.forEach(e => {
    draw.appendChild(e.div);
  });
}

// EVENT LISTENERS
document.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!touch.target) {
    deck.forEach(card => {
      card.selected = false;
      card.div.style.border = '1px solid white';
    });
    selbox.div = Object.assign(document.createElement('div'), { className: 'selectionbox' });
    selbox.active = true;
    selbox.x = e.touches[0].clientX;
    selbox.y = e.touches[0].clientY;
    Object.assign(selbox.div.style, {
      left: `${selbox.x}px`,
      top: `${selbox.y}px`
    });
    document.body.appendChild(selbox.div);
  }
});

document.addEventListener('touchmove', (e) => {
  e.preventDefault();
  touch.x = e.touches[0].clientX;
  touch.y = e.touches[0].clientY;
  
  if (touch.drag && touch.target) {
    if (touch.target.selected) {
      deck.forEach(card => {
        if (card.selected) {
          if (shuffling) card.setPosition(touch.x + touch.target.offsetX, touch.y + touch.target.offsetY);
          else card.setPosition(touch.x + card.offsetX, touch.y + card.offsetY);
        }
      });
    } else {
      touch.target.setPosition(touch.x + touch.target.offsetX, touch.y + touch.target.offsetY);
    }
  }

  if (selbox.active) {
    const rect = {
      x: Math.min(touch.x, selbox.x),
      y: Math.min(touch.y, selbox.y),
      w: Math.abs(touch.x - selbox.x),
      h: Math.abs(touch.y - selbox.y)
    };

    Object.assign(selbox.div.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.w}px`,
      height: `${rect.h}px`
    });

    deck.forEach(card => {
      const { x, y } = card.pos;
      const inside = x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
      card.selected = inside;
      card.div.style.border = `1px solid ${inside ? 'orange' : 'white'}`;
    });
  }

  if (Math.abs(touch.x - touch.lastX) > 20 || Math.abs(touch.y - touch.lastY) > 20) {
    touch.shakeCount++;
    if (touch.shakeCount >= 5 && touch.drag) {
      shuffleSelectedCards();
      touch.shakeCount = 0;
    }
  } else {
    touch.shakeCount = 0;
  }
  touch.lastX = touch.x;
  touch.lastY = touch.y;
});

document.addEventListener('touchend', () => {
  shuffling = false;
  touch.drag = false;
  touch.target = null;
  if (selbox.active) {
    selbox.active = false;
    selbox.div.remove();
  }
});

// RUNTIME
[...Array(10)].forEach((_, i) => suits.forEach(suit => new Card(`${i + 1} ${suit}`)));
['J', 'Q', 'K'].forEach(rank => suits.forEach(suit => new Card(`${rank} ${suit}`)));
['JKR', 'JKR'].forEach(joker => new Card(joker));

init();

setInterval(() => {
  localStorage.removeItem('deck');
  localStorage.setItem('deck', JSON.stringify(deck));
  console.log('Session Saved');
}, 10000);
