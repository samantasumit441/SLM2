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

// Stat page
const statPage = document.getElementById('stat-page');
const statButton = document.getElementById('stat-button');
const liveClock = document.getElementById('live-clock');
const backToTimelineButton = document.getElementById('back-to-timeline-button');
const relationshipStartDateInput = document.getElementById('relationship-start-date');

// Scratch Card elements
const scratchCardContainer = document.getElementById('scratch-card-container');
const scratchCardButton = document.getElementById('scratch-card-button');
const createScratchCardButton = document.getElementById('create-scratch-card-button');
const backToTimelineFromScratchButton = document.getElementById('back-to-timeline-from-scratch-button');
const createScratchCardModal = document.getElementById('create-scratch-card-modal');
const closeScratchModalButton = document.querySelector('.close-scratch-modal-button');
const scratchCardType = document.getElementById('scratch-card-type');
const scratchCardText = document.getElementById('scratch-card-text');
const scratchCardImage = document.getElementById('scratch-card-image');
const saveScratchCardButton = document.getElementById('save-scratch-card-button');
const scratchModalError = document.getElementById('scratch-modal-error');
const scratchCardDisplay = document.getElementById('scratch-card-display');


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
    console.log('Fetching memories...');
    const { data: memories, error } = await _supabase
        .from('memories')
        .select('*')
        .order('memory_date', { ascending: false });

    if (error) {
        console.error('Error fetching memories:', error);
    } else {
        console.log('Memories fetched successfully:', memories);
        renderMemories(memories);
    }
};

// Render memories to the DOM
const renderMemories = async (memories) => {
    console.log('Rendering memories:', memories);
    timelineFeed.innerHTML = ''; // Clear existing memories
    if (!memories || memories.length === 0) {
        console.log('No memories to render.');
        timelineFeed.innerHTML = '<p>No memories yet. Add one!</p>';
        return;
    }

    const { data: { session } } = await _supabase.auth.getSession();
    const user = session?.user;

    memories.forEach(memory => {
        console.log('Rendering memory:', memory);
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
        
        const memoryImageStyle = memory.image_url ? `style="background-image: url('${memory.image_url}')"` : '';
        
        memoryCard.innerHTML = `
            <div class="memory-background" ${memoryImageStyle}></div>
            <div class="memory-content">
                <div class="emoji">${memory.emoji || ''}</div>
                <div class="date">${new Date(memory.memory_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div class="story">${memory.story}</div>
                ${actions}
            </div>
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
});

// --- STATS PAGE ---

const updateClock = (startDate) => {
    if (!startDate) {
        liveClock.innerHTML = '<div class="clock-text">Please select a start date.</div>';
        return;
    }

    const now = new Date();
    const diff = now - startDate;

    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * (365.25 / 12)));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * (365.25 / 12))) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    liveClock.innerHTML = `
        <div class="heart-shape"></div>
        <div class="clock-text">
            ${years}y ${months}m ${days}d<br>
            ${hours}h ${minutes}m ${seconds}s
        </div>
    `;
};

const startClock = () => {
    const savedDate = localStorage.getItem('relationshipStartDate');
    if (savedDate) {
        relationshipStartDateInput.value = savedDate;
    }

    const startDate = savedDate ? new Date(savedDate) : null;
    
    updateClock(startDate);
    if (clockInterval) clearInterval(clockInterval);
    if (startDate) {
        clockInterval = setInterval(() => updateClock(startDate), 1000);
    }
};

relationshipStartDateInput.addEventListener('change', () => {
    const selectedDate = relationshipStartDateInput.value;
    if (selectedDate) {
        localStorage.setItem('relationshipStartDate', selectedDate);
        startClock();
    }
});

statButton.addEventListener('click', () => {
    timelineContainer.style.display = 'none';
    statPage.style.display = 'block';
    startClock();
});

backToTimelineButton.addEventListener('click', () => {
    statPage.style.display = 'none';
    timelineContainer.style.display = 'block';
    clearInterval(clockInterval);
});

// --- SCRATCH CARD ---

// Show/Hide Scratch Card Page
scratchCardButton.addEventListener('click', () => {
    timelineContainer.style.display = 'none';
    scratchCardContainer.style.display = 'block';
    fetchScratchCards();
});

backToTimelineFromScratchButton.addEventListener('click', () => {
    scratchCardContainer.style.display = 'none';
    timelineContainer.style.display = 'block';
});

// Modal Handling
createScratchCardButton.addEventListener('click', () => {
    createScratchCardModal.style.display = 'flex';
});

closeScratchModalButton.addEventListener('click', () => {
    createScratchCardModal.style.display = 'none';
});

scratchCardType.addEventListener('change', () => {
    if (scratchCardType.value === 'text') {
        scratchCardText.style.display = 'block';
        scratchCardImage.style.display = 'none';
    } else {
        scratchCardText.style.display = 'none';
        scratchCardImage.style.display = 'block';
    }
});

// Save Scratch Card
saveScratchCardButton.addEventListener('click', async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        scratchModalError.textContent = 'You must be logged in.';
        return;
    }

    const type = scratchCardType.value;
    let textContent = null;
    let imageUrl = null;

    if (type === 'text') {
        if (!scratchCardText.value) {
            scratchModalError.textContent = 'Please enter a message.';
            return;
        }
        textContent = scratchCardText.value;
    } else {
        const imageFile = scratchCardImage.files[0];
        if (!imageFile) {
            scratchModalError.textContent = 'Please select an image.';
            return;
        }
        const filePath = `public/scratch-cards/${user.id}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await _supabase.storage.from('memory-images').upload(filePath, imageFile);
        if (uploadError) {
            scratchModalError.textContent = `Image upload failed: ${uploadError.message}`;
            return;
        }
        const { data: { publicUrl } } = _supabase.storage.from('memory-images').getPublicUrl(filePath);
        imageUrl = publicUrl;
    }

    const { error } = await _supabase.from('scratch_cards').insert([
        { user_id: user.id, card_type: type, content_text: textContent, content_image_url: imageUrl }
    ]);

    if (error) {
        scratchModalError.textContent = `Error: ${error.message}`;
    } else {
        createScratchCardModal.style.display = 'none';
        fetchScratchCards();
    }
});

// Fetch and Render Scratch Cards
const fetchScratchCards = async () => {
    const { data: cards, error } = await _supabase.from('scratch_cards').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching scratch cards:', error);
    } else {
        renderScratchCards(cards);
    }
};

const renderScratchCards = (cards) => {
    scratchCardDisplay.innerHTML = '';
    cards.forEach(card => {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'scratch-card-wrapper';

        const content = card.card_type === 'text'
            ? `<div class="scratch-content-text">${card.content_text}</div>`
            : `<img src="${card.content_image_url}" class="scratch-content-image">`;

        cardWrapper.innerHTML = `
            <div class="scratch-content">${content}</div>
            <canvas class="scratch-canvas"></canvas>
        `;
        scratchCardDisplay.appendChild(cardWrapper);
        initScratchCanvas(cardWrapper.querySelector('.scratch-canvas'));
    });
};

const initScratchCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Fill with scratchable surface
    ctx.fillStyle = '#d17a86';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isDrawing = false;

    const scratch = (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX || e.touches[0].clientX - rect.left;
        const y = e.clientY || e.touches[0].clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    };

    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mousemove', scratch);

    canvas.addEventListener('touchstart', () => isDrawing = true);
    canvas.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('touchmove', scratch);
};

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
        resetMemoryModal();
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
        console.log('Change received!', payload);
        fetchMemories();
    })
    .subscribe();

// --- INITIAL LOAD ---
checkUser();
