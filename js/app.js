// The Emperor's Journal - Main App Logic with Book Navigation

class EmperorsJournal {
    constructor() {
        this.currentMeditation = this.loadProgress();
        this.isAnimating = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.menuOpen = false;
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.renderMeditation();
        this.attachEventListeners();
        this.updateProgress();
        this.renderBookMenu();
    }

    cacheElements() {
        this.navLeft = document.getElementById('navLeft');
        this.navRight = document.getElementById('navRight');
        this.meditationText = document.getElementById('meditationText');
        this.meditationImage = document.getElementById('meditationImage');
        this.bookTitle = document.getElementById('bookTitle');
        this.meditationNumber = document.getElementById('meditationNumber');
        this.progressBar = document.getElementById('progressBar');
        this.contentArea = document.querySelector('.content-area');
        this.app = document.getElementById('app');
        this.menuButton = document.getElementById('menuButton');
        this.bookMenu = document.getElementById('bookMenu');
        this.bookMenuOverlay = document.getElementById('bookMenuOverlay');
        this.bookMenuContent = document.getElementById('bookMenuContent');
        this.closeMenuButton = document.getElementById('closeMenuButton');
    }

    attachEventListeners() {
        // Tap navigation
        this.navLeft.addEventListener('click', () => this.previousMeditation());
        this.navRight.addEventListener('click', () => this.nextMeditation());

        // Menu toggle
        this.menuButton.addEventListener('click', () => this.toggleMenu());
        this.closeMenuButton.addEventListener('click', () => this.closeMenu());
        this.bookMenuOverlay.addEventListener('click', () => this.closeMenu());

        // Swipe gestures
        this.app.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.app.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousMeditation();
            if (e.key === 'ArrowRight') this.nextMeditation();
            if (e.key === 'Escape' && this.menuOpen) this.closeMenu();
        });

        // Prevent image dragging
        this.meditationImage.addEventListener('dragstart', (e) => e.preventDefault());

        // Prevent pull-to-refresh
        this.preventPullToRefresh();
    }

    preventPullToRefresh() {
        let lastTouchY = 0;
        let preventPullToRefresh = false;
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            lastTouchY = e.touches[0].clientY;
            preventPullToRefresh = window.pageYOffset === 0;
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const touchYDelta = touchY - lastTouchY;
            lastTouchY = touchY;
            
            if (preventPullToRefresh && touchYDelta > 0) {
                e.preventDefault();
                return false;
            }
        }, { passive: false });
    }

    renderBookMenu() {
        const menuHTML = MEDITATIONS_DATA.books.map(book => {
            const startMed = this.getBookStartMeditation(book.id);
            const endMed = startMed + book.meditations.length - 1;
            const isActive = this.isInBook(book.id);
            return `
                <div class="book-item ${isActive ? 'active' : ''}" data-book-id="${book.id}">
                    <div class="book-item-title">Book ${book.id}: ${book.title}</div>
                    <div class="book-item-subtitle">${book.meditations.length} meditations</div>
                </div>
            `;
        }).join('');

        this.bookMenuContent.innerHTML = menuHTML;

        // Add click handlers
        document.querySelectorAll('.book-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const bookId = parseInt(e.currentTarget.dataset.bookId);
                this.jumpToBook(bookId);
            });
        });
    }

    getBookStartMeditation(bookId) {
        let meditation = 1;
        for (let i = 0; i < bookId - 1; i++) {
            meditation += MEDITATIONS_DATA.books[i].meditations.length;
        }
        return meditation;
    }

    isInBook(bookId) {
        const bookInfo = this.getBookInfo(this.currentMeditation);
        return bookInfo && bookInfo.bookId === bookId;
    }

    jumpToBook(bookId) {
        const startMed = this.getBookStartMeditation(bookId);
        this.currentMeditation = startMed;
        this.saveProgress();
        this.transitionMeditation();
        this.closeMenu();
        this.renderBookMenu();
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
        if (this.menuOpen) {
            this.bookMenu.classList.add('open');
            this.bookMenuOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        } else {
            this.closeMenu();
        }
    }

    closeMenu() {
        this.menuOpen = false;
        this.bookMenu.classList.remove('open');
        this.bookMenuOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    getBookInfo(meditationNum) {
        let currentMed = 0;
        
        for (let book of MEDITATIONS_DATA.books) {
            const bookMeditations = book.meditations.length;
            if (meditationNum <= currentMed + bookMeditations) {
                const medInBook = meditationNum - currentMed;
                return {
                    bookId: book.id,
                    bookTitle: book.title,
                    medInBook: medInBook,
                    totalInBook: bookMeditations
                };
            }
            currentMed += bookMeditations;
        }
        
        return null;
    }

    getMeditationByNumber(num) {
        let currentMed = 0;
        
        for (let book of MEDITATIONS_DATA.books) {
            const bookMeditations = book.meditations.length;
            if (num <= currentMed + bookMeditations) {
                const medIndex = num - currentMed - 1;
                return {
                    ...book.meditations[medIndex],
                    bookId: book.id,
                    bookTitle: book.title
                };
            }
            currentMed += bookMeditations;
        }
        
        return null;
    }

    getTotalMeditations() {
        return MEDITATIONS_DATA.books.reduce((total, book) => 
            total + book.meditations.length, 0);
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left - next meditation
                this.nextMeditation();
            } else {
                // Swiped right - previous meditation
                this.previousMeditation();
            }
        }
    }

    nextMeditation() {
        if (this.isAnimating) return;
        
        const totalMeditations = this.getTotalMeditations();
        if (this.currentMeditation < totalMeditations) {
            this.currentMeditation++;
            this.saveProgress();
            this.transitionMeditation();
        }
    }

    previousMeditation() {
        if (this.isAnimating) return;
        
        if (this.currentMeditation > 1) {
            this.currentMeditation--;
            this.saveProgress();
            this.transitionMeditation();
        }
    }

    transitionMeditation() {
        this.isAnimating = true;
        
        // Fade out
        this.meditationText.style.opacity = '0';
        this.meditationText.style.transform = 'scale(0.98)';
        this.meditationImage.parentElement.style.opacity = '0';
        this.meditationImage.parentElement.style.transform = 'scale(0.98)';

        setTimeout(() => {
            this.renderMeditation();
            this.updateProgress();
            
            // Fade in
            setTimeout(() => {
                this.meditationText.style.opacity = '1';
                this.meditationText.style.transform = 'scale(1)';
                this.meditationImage.parentElement.style.opacity = '1';
                this.meditationImage.parentElement.style.transform = 'scale(1)';
                
                setTimeout(() => {
                    this.isAnimating = false;
                }, 400);
            }, 50);
        }, 300);
    }

    renderMeditation() {
        const meditation = this.getMeditationByNumber(this.currentMeditation);
        
        if (!meditation) {
            console.error('Meditation not found:', this.currentMeditation);
            return;
        }

        // Update text
        const textElement = this.meditationText.querySelector('p');
        if (textElement) {
            textElement.textContent = meditation.text;
        } else {
            this.meditationText.innerHTML = `<p>${meditation.text}</p>`;
        }
        
        // Update image
        this.meditationImage.src = meditation.image;
        this.meditationImage.alt = `Meditation ${this.currentMeditation} - ${meditation.bookTitle}`;
    }

    updateProgress() {
        const bookInfo = this.getBookInfo(this.currentMeditation);
        
        if (bookInfo) {
            // Update book title
            this.bookTitle.textContent = `Book ${bookInfo.bookId}: ${bookInfo.bookTitle}`;
            
            // Update meditation number
            this.meditationNumber.textContent = 
                `Meditation ${bookInfo.medInBook} of ${bookInfo.totalInBook}`;
            
            // Update progress bar (within current book)
            const progress = (bookInfo.medInBook / bookInfo.totalInBook) * 100;
            this.progressBar.style.width = `${progress}%`;
        }
    }

    saveProgress() {
        try {
            const progressData = {
                meditation: this.currentMeditation,
                timestamp: Date.now()
            };
            localStorage.setItem('emperorJournalProgress', JSON.stringify(progressData));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('emperorJournalProgress');
            if (saved) {
                const data = JSON.parse(saved);
                const meditation = data.meditation || 1;
                
                // Validate saved meditation number
                const totalMeditations = this.getTotalMeditations();
                if (meditation >= 1 && meditation <= totalMeditations) {
                    return meditation;
                }
            }
        } catch (e) {
            console.error('Failed to load progress:', e);
        }
        return 1; // Default to first meditation
    }
}

// Initialize app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new EmperorsJournal();
    });
} else {
    new EmperorsJournal();
}

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
