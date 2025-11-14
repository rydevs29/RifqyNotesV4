document.addEventListener('DOMContentLoaded', () => {
    // ELEMEN DOM
    const noteForm = document.getElementById('note-form');
    const noteInput = document.getElementById('note-input');
    const categoryInput = document.getElementById('category-input');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    const notesContainer = document.getElementById('notes-container');
    const voiceBtn = document.getElementById('voice-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const summaryModal = document.getElementById('summary-modal');
    const summaryText = document.getElementById('summary-text');
    const closeModalBtn = document.querySelector('.close-btn');

    // --- FITUR BARU: MANAJEMEN TEMA ---
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.add(savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        }
        updateThemeIcon();
    };

    const updateThemeIcon = () => {
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    };

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon();
    });

    // --- FITUR BARU: REKAM SUARA KE TEKS (Web Speech API) ---
    let recognition;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            noteInput.value = noteInput.value.trim() + ' ' + finalTranscript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopVoiceRecognition();
        };
    }

    const startVoiceRecognition = () => {
        if (recognition) {
            recognition.start();
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        }
    };

    const stopVoiceRecognition = () => {
        if (recognition) {
            recognition.stop();
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        }
    };

    voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('recording')) {
            stopVoiceRecognition();
        } else {
            startVoiceRecognition();
        }
    });

    // --- FUNGSI DASAR: LOCAL STORAGE ---
    const getNotes = () => JSON.parse(localStorage.getItem('rifqyNotesV3')) || [];
    const saveNotes = (notes) => localStorage.setItem('rifqyNotesV3', JSON.stringify(notes));

    // --- FITUR BARU: FUNGSI PENCARIAN & FILTER ---
    const filterNotes = () => {
        const notes = getNotes();
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        const filteredNotes = notes.filter(note => {
            const matchesSearch = note.text.toLowerCase().includes(searchTerm) || note.category.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === '' || note.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        renderNotes(filteredNotes);
    };

    searchInput.addEventListener('input', filterNotes);
    categoryFilter.addEventListener('change', filterNotes);

    // --- FUNGSI RENDER CATATAN (DIPERBARUI) ---
    const renderNotes = (notesToRender = getNotes()) => {
        notesContainer.innerHTML = '';
        if (notesToRender.length === 0) {
            notesContainer.innerHTML = '<p style="text-align:center; color:#777;">Tidak ada catatan yang cocok.</p>';
            return;
        }
        notesToRender.forEach(note => notesContainer.appendChild(createNoteElement(note)));
    };

    // --- FUNGSI MEMBUAT ELEMEN CATATAN (DIPERBARUI) ---
    const createNoteElement = (note) => {
        const div = document.createElement('div');
        div.classList.add('note-card');
        div.dataset.id = note.id;

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const formattedDate = new Date(note.timestamp).toLocaleDateString('id-ID', options);

        div.innerHTML = `
            <div class="category">${note.category}</div>
            <p>${note.text}</p>
            <div class="actions">
                <div class="action-buttons">
                    <button class="edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                </div>
                <button class="summarize-btn" title="Ringkas dengan AI"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
            </div>
            <div class="timestamp">${formattedDate}</div>
        `;

        div.querySelector('.delete-btn').addEventListener('click', () => deleteNote(note.id));
        div.querySelector('.edit-btn').addEventListener('click', () => editNote(note.id));
        // --- FITUR BARU: TOMBOL RINGKAS AI ---
        div.querySelector('.summarize-btn').addEventListener('click', () => summarizeNote(note.text));

        return div;
    };

    // --- FUNGSI TAMBAH/UPDATE/HAPUS (DIPERBARUI) ---
    const addOrUpdateNote = (text, category, id = null) => {
        const notes = getNotes();
        if (id) {
            const noteIndex = notes.findIndex(n => n.id === id);
            if (noteIndex !== -1) {
                notes[noteIndex] = { ...notes[noteIndex], text, category, timestamp: Date.now() };
            }
        } else {
            const newNote = { id: Date.now(), text, category, timestamp: Date.now() };
            notes.unshift(newNote);
        }
        saveNotes(notes);
        renderNotes();
    };

    const deleteNote = (id) => {
        if (confirm('Yakin ingin menghapus catatan ini?')) {
            const notes = getNotes().filter(n => n.id !== id);
            saveNotes(notes);
            renderNotes();
        }
    };
    
    const editNote = (id) => {
        const notes = getNotes();
        const note = notes.find(n => n.id === id);
        if (note) {
            noteInput.value = note.text;
            categoryInput.value = note.category;
            noteInput.focus();
            // Hapus catatan lama, form submit akan menambahkan yang baru
            deleteNote(id);
        }
    };

    // --- FITUR BARU: RINGKASAN AI ---
    const summarizeNote = async (text) => {
        // !!! GANTI DENGAN API KEY-MU !!!
        const API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Contoh: API Key OpenAI
        if (API_KEY === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
            alert('Fitur AI memerlukan API Key. Lihat komentar di script.js untuk informasi lebih lanjut.');
            return;
        }

        summaryText.innerText = 'Sedang meringkas...';
        summaryModal.style.display = 'block';

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: `Jadilah asisten yang merangkum. Buat ringkasan singkat dari teks berikut dalam bahasa Indonesia: "${text}"` }],
                    max_tokens: 100
                })
            });

            if (!response.ok) throw new Error('Gagal menghubungi API AI.');

            const data = await response.json();
            const summary = data.choices[0].message.content.trim();
            summaryText.innerText = summary;

        } catch (error) {
            console.error(error);
            summaryText.innerText = 'Maaf, terjadi kesalahan saat meringkas.';
        }
    };
    
    closeModalBtn.onclick = () => summaryModal.style.display = 'none';
    window.onclick = (event) => { if (event.target == summaryModal) summaryModal.style.display = 'none'; };

    // --- EVENT LISTENER FORM ---
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = noteInput.value.trim();
        const category = categoryInput.value;
        if (text) {
            addOrUpdateNote(text, category);
            noteInput.value = '';
            noteInput.focus();
        }
    });

    // --- INISIALISASI ---
    initTheme();
    renderNotes();
});
