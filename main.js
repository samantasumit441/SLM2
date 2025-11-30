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
const modalTitle = document.getElementById('modal-title');
const memoryIdInput = document.getElementById('memory-id');
const memoryImageInput = document.getElementById('memory-image');
const imagePreview = document.getElementById('image-preview');

// Delete confirmation modal
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteButton = document.getElementById('confirm-delete-button');
const cancelDeleteButton = document.getElementById('cancel-delete-button');

// Stat modal
const statModal = document.getElementById('stat-modal');
const statButton = document.getElementById('stat-button');
const liveClock = document.getElementById('live-clock');

let memoryToDeleteId = null;
let clockInterval;

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
    const { data: { session } } = _supabase.auth.getSession();
    const user = session?.user;

    memories.forEach(memory => {
        const memoryCard = document.createElement('div');
        memoryCard.classList.add('memory-card');
        
        let actions = '';
        if (user && user.id === memory.user_id) {
            actions = `
                <div class="actions">
                    <button class="edit-button" data-id="${memory.id}">Edit</button>
                    <button class="delete-button" data-id="${memory.id}">Delete</button>
                </div>
            `;
        }
        
        memoryCard.innerHTML = `
            <div class="emoji">${memory.emoji || ''}</div>
            <div class="date">${new Date(memory.memory_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="story">${memory.story}</div>
            ${memory.image_url ? `<img src="${memory.image_url}" alt="Memory image">` : ''}
            ${actions}
        `;
        timelineFeed.appendChild(memoryCard);
    });

    // Add event listeners for the new buttons
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', () => {
            const memoryId = button.dataset.id;
            const memoryToEdit = memories.find(m => m.id == memoryId);
            openEditModal(memoryToEdit);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', () => {
            const memoryId = button.dataset.id;
            openDeleteModal(memoryId);
        });
    });
};

// --- MODAL HANDLING ---

const resetMemoryModal = () => {
    modalTitle.textContent = 'Add a New Memory';
    memoryIdInput.value = '';
    memoryDateInput.value = '';
    memoryEmojiInput.value = '';
    memoryStoryInput.value = '';
    memoryImageInput.value = '';
    imagePreview.src = '#';
    imagePreview.style.display = 'none';
    modalError.textContent = '';
};

// Open and close add/edit modal
addMemoryButton.addEventListener('click', () => {
    resetMemoryModal();
    memoryModal.style.display = 'flex';
});

closeModalButton.addEventListener('click', () => {
    memoryModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === memoryModal) {
        memoryModal.style.display = 'none';
    }
    if (event.target === deleteModal) {
        deleteModal.style.display = 'none';
    }
    if (event.target === statModal) {
        statModal.style.display = 'none';
        clearInterval(clockInterval);
    }
});

// --- STAT MODAL ---

const calculateTime = () => {
    const startDate = new Date('2023-01-01T00:00:00');
    const now = new Date();

    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();
    let hours = now.getHours() - startDate.getHours();
    let minutes = now.getMinutes() - startDate.getMinutes();
    let seconds = now.getSeconds() - startDate.getSeconds();

    if (seconds < 0) {
        minutes--;
        seconds += 60;
    }
    if (minutes < 0) {
        hours--;
        minutes += 60;
    }
    if (hours < 0) {
        days--;
        hours += 24;
    }
    if (days < 0) {
        months--;
        const daysInLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += daysInLastMonth;
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    liveClock.innerHTML = `
        ${years} years, ${months} months, ${days} days<br>
        ${hours} hours, ${minutes} minutes, ${seconds} seconds
    `;
};

statButton.addEventListener('click', () => {
    statModal.style.display = 'flex';
    calculateTime();
    clockInterval = setInterval(calculateTime, 1000);
});

statModal.querySelector('.close-button').addEventListener('click', () => {
    statModal.style.display = 'none';
    clearInterval(clockInterval);
});

// Open modal in edit mode
const openEditModal = (memory) => {
    resetMemoryModal();
    modalTitle.textContent = 'Edit Memory';
    memoryIdInput.value = memory.id;
    memoryDateInput.value = memory.memory_date;
    memoryEmojiInput.value = memory.emoji || '';
    memoryStoryInput.value = memory.story;
    if (memory.image_url) {
        imagePreview.src = memory.image_url;
        imagePreview.style.display = 'block';
    }
    memoryModal.style.display = 'flex';
};

// Handle image preview
memoryImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.src = '#';
        imagePreview.style.display = 'none';
    }
});

// --- CRUD OPERATIONS ---

// Save a new memory or update an existing one
saveMemoryButton.addEventListener('click', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        modalError.textContent = 'You must be logged in.';
        return;
    }

    const memoryId = memoryIdInput.value;
    const memoryDate = memoryDateInput.value;
    const emoji = memoryEmojiInput.value;
    const story = memoryStoryInput.value;
    const imageFile = memoryImageInput.files[0];

    if (!memoryDate || !story) {
        modalError.textContent = 'Please fill in the date and story.';
        return;
    }

    let imageUrl = imagePreview.src.startsWith('data:') ? null : imagePreview.src;
    if (imageFile) {
        // Upload image to Supabase Storage
        const filePath = `public/${user.id}/${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await _supabase.storage
            .from('memory-images')
            .upload(filePath, imageFile);

        if (uploadError) {
            modalError.textContent = `Image upload failed: ${uploadError.message}`;
            return;
        }
        
        const { data: { publicUrl } } = _supabase.storage.from('memory-images').getPublicUrl(filePath);
        imageUrl = publicUrl;
    }
    
    const memoryData = {
        user_id: user.id,
        memory_date: memoryDate,
        emoji: emoji,
        story: story,
        image_url: imageUrl,
    };

    let error;
    if (memoryId) {
        // Update existing memory
        const { error: updateError } = await _supabase
            .from('memories')
            .update(memoryData)
            .eq('id', memoryId);
        error = updateError;
    } else {
        // Insert new memory
        const { error: insertError } = await _supabase
            .from('memories')
            .insert([memoryData]);
        error = insertError;
    }

    if (error) {
        modalError.textContent = `Error: ${error.message}`;
    } else {
        memoryModal.style.display = 'none';
        fetchMemories();
    }
});

// Delete a memory
const openDeleteModal = (id) => {
    memoryToDeleteId = id;
    deleteModal.style.display = 'flex';
};

confirmDeleteButton.addEventListener('click', async () => {
    if (!memoryToDeleteId) return;

    // TODO: Delete image from storage if it exists

    const { error } = await _supabase
        .from('memories')
        .delete()
        .eq('id', memoryToDeleteId);
    
    if (error) {
        alert(`Error deleting memory: ${error.message}`);
    }
    
    deleteModal.style.display = 'none';
    memoryToDeleteId = null;
    fetchMemories();
});

cancelDeleteButton.addEventListener('click', () => {
    deleteModal.style.display = 'none';
    memoryToDeleteId = null;
});


// --- REAL-TIME SUBSCRIPTION ---

// Listen for changes
_supabase.channel('memories')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, payload => {
        fetchMemories();
    })
    .subscribe();

// --- INITIAL LOAD ---
checkUser();
