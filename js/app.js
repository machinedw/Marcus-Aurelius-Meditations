// ================================================
// THE EMPEROR'S JOURNAL - App Logic
// Navigation, Progress Tracking, LocalStorage
// ================================================

class MeditationApp {
    constructor() {
        this.currentBook = 0;
        this.currentMeditation = 0;
        this.totalMeditations = 0;
        this.data = MEDITATIONS_DATA;
        
        // Calculate total meditations
        this.data.books.forEach(book => {
            this.totalMeditations += book.meditations.length;
        });
        
        // DOM elements
        this.elements = {
            bookTitle: document.getElementById('bookTitle'),
            meditationNumber: document.getElementById('meditationNumber'),
            progressBar: document.getElementById('progressBar'),
            meditationText: document.getElementById('meditationText'),
            meditationImage: document.getElementById('meditationImage'),
            navLeft: document.getElementById('navLeft'),
            navRight: document.getElementById('navRight'),
            contentArea: document.querySelector('.content-area'),
            app: document.getElementById('app')
        };
        
        this.init();
    }
    
    init() {
        // Load saved progress
        this.loadProgress();
        
        // Display current meditation
        this.displayMeditation();
        
        // Setup event listeners
        this.setupListeners();
        
        // Prevent pull-to-refresh on iOS
        this.preventPullToRefresh();
    }
    
    setupListeners() {
        // Tap navigation
        this.elements.navLeft.addEventListener('click', () => this.previousMeditation());
        this.elements.navRight.addEventListener('click', () => this.nextMeditation());
        
        // Swipe navigation
        this.setupSwipeGestures();
        
        // Keyboard navigation (for desktop testing)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousMeditation();
            if (e.key === 'ArrowRight') this.nextMeditation();
        });
    }
    
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;
        
        this.elements.app.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        this.elements.app.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX, minSwipeDistance);
        }, { passive: true });
    }
    
    handleSwipe(startX, endX, minDistance) {
        const diff = startX - endX;
        
        if (Math.abs(diff) > minDistance) {
            if (diff > 0) {
                // Swiped left - next meditation
                this.nextMeditation();
            } else {
                // Swiped right - previous meditation
                this.previousMeditation();
            }
        }
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
    
    displayMeditation() {
        const book = this.data.books[this.currentBook];
        const meditation = book.meditations[this.currentMeditation];
        
        // Fade out
        this.fadeOut(() => {
            // Update content
            this.elements.bookTitle.textContent = `Book ${book.id}: ${book.title}`;
            
            const meditationInBook = this.currentMeditation + 1;
            const totalInBook = book.meditations.length;
            this.elements.meditationNumber.textContent = 
                `Meditation ${meditationInBook} of ${totalInBook}`;
            
            // Update progress bar (within current book)
            const progress = (meditationInBook / totalInBook) * 100;
            this.elements.progressBar.style.width = `${progress}%`;
            
            // Update meditation text
            this.elements.meditationText.querySelector('p').textContent = meditation.text;
            
            // Update image
            this.elements.meditationImage.src = meditation.image;
            this.elements.meditationImage.alt = `Meditation ${meditationInBook} - ${book.title}`;
            
            // Fade in
            this.fadeIn();
            
            // Save progress
            this.saveProgress();
        });
    }
    
    fadeOut(callback) {
        this.elements.meditationText.classList.add('fade-out');
        this.elements.meditationImage.parentElement.classList.add('fade-out');
        
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }
    
    fadeIn() {
        setTimeout(() => {
            this.elements.meditationText.classList.remove('fade-out');
            this.elements.meditationImage.parentElement.classList.remove('fade-out');
            
            this.elements.meditationText.classList.add('fade-in');
            this.elements.meditationImage.parentElement.classList.add('fade-in');
            
            setTimeout(() => {
                this.elements.meditationText.classList.remove('fade-in');
                this.elements.meditationImage.parentElement.classList.remove('fade-in');
            }, 400);
        }, 50);
    }
    
    nextMeditation() {
        const currentBook = this.data.books[this.currentBook];
        
        // Check if there's a next meditation in current book
        if (this.currentMeditation < currentBook.meditations.length - 1) {
            this.currentMeditation++;
        }
        // Check if there's a next book
        else if (this.currentBook < this.data.books.length - 1) {
            this.currentBook++;
            this.currentMeditation = 0;
        }
        // Reached the end - loop back to beginning
        else {
            this.currentBook = 0;
            this.currentMeditation = 0;
        }
        
        this.displayMeditation();
    }
    
    previousMeditation() {
        // Check if there's a previous meditation in current book
        if (this.currentMeditation > 0) {
            this.currentMeditation--;
        }
        // Check if there's a previous book
        else if (this.currentBook > 0) {
            this.currentBook--;
            const previousBook = this.data.books[this.currentBook];
            this.currentMeditation = previousBook.meditations.length - 1;
        }
        // At the beginning - loop to end
        else {
            this.currentBook = this.data.books.length - 1;
            const lastBook = this.data.books[this.currentBook];
            this.currentMeditation = lastBook.meditations.length - 1;
        }
        
        this.displayMeditation();
    }
    
    saveProgress() {
        const progress = {
            book: this.currentBook,
            meditation: this.currentMeditation,
            timestamp: Date.now()
        };
        
        localStorage.setItem('emperorJournalProgress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('emperorJournalProgress');
        
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                
                // Validate saved data
                if (progress.book >= 0 && progress.book < this.data.books.length) {
                    this.currentBook = progress.book;
                    
                    const book = this.data.books[this.currentBook];
                    if (progress.meditation >= 0 && progress.meditation < book.meditations.length) {
                        this.currentMeditation = progress.meditation;
                    }
                }
            } catch (error) {
                console.error('Error loading progress:', error);
                // Start from beginning if there's an error
                this.currentBook = 0;
                this.currentMeditation = 0;
            }
        }
    }
    
    getAbsoluteMeditationNumber() {
        let absoluteNumber = 0;
        
        // Add all meditations from previous books
        for (let i = 0; i < this.currentBook; i++) {
            absoluteNumber += this.data.books[i].meditations.length;
        }
        
        // Add current meditation position
        absoluteNumber += this.currentMeditation + 1;
        
        return absoluteNumber;
    }
    
    getTotalProgress() {
        return (this.getAbsoluteMeditationNumber() / this.totalMeditations) * 100;
    }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MeditationApp();
    });
} else {
    new MeditationApp();
}
