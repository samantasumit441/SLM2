// Supabase credentials
const SUPABASE_URL = 'https://snnnpegfnrhrqgmtptja.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubm5wZWdmbnJocnFnbXRwdGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjQ3MzUsImV4cCI6MjA4MDAwMDczNX0.IR6ZMIJYjc6o4VyRCZ2SVCvG7FFjFSGzHmZWxSrIj2E';

// Initialize Supabase client
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const authContainer = document.getElementById('auth-container');
const timelineContainer = document.getElementById('timeline-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const logoutButton = document.getElementById('logout-button');
const authError = document.getElementById('auth-error');
const timelineFeed = document.getElementById('timeline-feed');
const addMemoryButton = document.getElementById('add-memory-button');
const memoryModal = document.getElementById('memory-modal');
const closeModalButton = document.querySelector('.close-button');
const saveMemoryButton = document.getElementById('save-memory-button');
const memoryDateInput = document.getElementById('memory-date');
const memoryEmojiInput = document.getElementById('memory-emoji');
const memoryStoryInput = document.getElementById('memory-story');
const modalError = document.getElementById('modal-error');

// --- AUTHENTICATION ---

// Handle login
loginButton.addEventListener('click', async () => {
    const { error } = await _supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value,
    });
    if (error) {
        authError.textContent = error.message;
    } else {
        authError.textContent = '';
        checkUser();
    }
});

// Handle signup
signupButton.addEventListener('click', async () => {
    const { error } = await _supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
    });
    if (error) {
        authError.textContent = error.message;
    } else {
        authError.textContent = 'Success! Check your email for a verification link.';
    }
});

// Handle logout
logoutButton.addEventListener('click', async () => {
    await _supabase.auth.signOut();
    checkUser();
});

// Check user session
const checkUser = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        authContainer.style.display = 'none';
        timelineContainer.style.display = 'block';
        fetchMemories();
    } else {
        authContainer.style.display = 'block';
        timelineContainer.style.display = 'none';
    }
};

// --- TIMELINE & MEMORIES ---

// Fetch and display memories
const fetchMemories = async () => {
    const { data: memories, error } = await _supabase
        .from('memories')
        .select('*')
        .order('memory_date', { ascending: false });

    if (error) {
        console.error('Error fetching memories:', error);
    } else {
        renderMemories(memories);
    }
};

// Render memories to the DOM
const renderMemories = (memories) => {
    timelineFeed.innerHTML = ''; // Clear existing memories
    memories.forEach(memory => {
        const memoryCard = document.createElement('div');
        memoryCard.classList.add('memory-card');
        memoryCard.innerHTML = `
            <div class="emoji">${memory.emoji || ''}</div>
            <div class="date">${new Date(memory.memory_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="story">${memory.story}</div>
        `;
        timelineFeed.appendChild(memoryCard);
    });
};

// --- MODAL HANDLING ---

// Open and close modal
addMemoryButton.addEventListener('click', () => {
    memoryModal.style.display = 'flex';
});

closeModalButton.addEventListener('click', () => {
    memoryModal.style.display = 'none';
    modalError.textContent = '';
});

window.addEventListener('click', (event) => {
    if (event.target === memoryModal) {
        memoryModal.style.display = 'none';
        modalError.textContent = '';
    }
});

// Save a new memory
saveMemoryButton.addEventListener('click', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        modalError.textContent = 'You must be logged in to add a memory.';
        return;
    }

    const memoryDate = memoryDateInput.value;
    const emoji = memoryEmojiInput.value;
    const story = memoryStoryInput.value;

    if (!memoryDate || !story) {
        modalError.textContent = 'Please fill in the date and story.';
        return;
    }

    const { error } = await _supabase
        .from('memories')
        .insert([{ 
            user_id: user.id,
            memory_date: memoryDate, 
            emoji: emoji, 
            story: story 
        }]);

    if (error) {
        modalError.textContent = `Error: ${error.message}`;
    } else {
        memoryModal.style.display = 'none';
        // Clear inputs
        memoryDateInput.value = '';
        memoryEmojiInput.value = '';
        memoryStoryInput.value = '';
        modalError.textContent = '';
    }
});

// --- REAL-TIME SUBSCRIPTION ---

// Listen for new memories
_supabase.channel('memories')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memories' }, payload => {
        // Simple refetch for now, can be optimized to just add the new one
        fetchMemories();
    })
    .subscribe();

// --- INITIAL LOAD ---
checkUser();
