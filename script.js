// script.js

// --- Data Structures and Persistence ---
const STORAGE_KEY_INVENTORY = 'shoppingListPWA_inventory';
const STORAGE_KEY_SHOPPING_LIST = 'shoppingListPWA_shoppingList';
const STORAGE_KEY_COLLAPSED = 'shoppingListPWA_collapsedCategories';

let inventory = JSON.parse(localStorage.getItem(STORAGE_KEY_INVENTORY)) || [];
let shoppingList = JSON.parse(localStorage.getItem(STORAGE_KEY_SHOPPING_LIST)) || [];
let collapsedCategories = JSON.parse(localStorage.getItem(STORAGE_KEY_COLLAPSED)) || { inventory: [], shoppingList: [] };

function saveInventory() {
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
}

function saveShoppingList() {
    localStorage.setItem(STORAGE_KEY_SHOPPING_LIST, JSON.stringify(shoppingList));
}

function saveCollapsedCategories() {
    localStorage.setItem(STORAGE_KEY_COLLAPSED, JSON.stringify(collapsedCategories));
}

// Helper to get category display names and colors
const categories = {
    'frescos': { name: '🍎 Frescos', colorVar: '--category-frescos' },
    'frigorifico': { name: '❄️ Frigorífico', colorVar: '--category-frigorifico' },
    'padaria': { name: '🥖 Padaria', colorVar: '--category-padaria' },
    'talho-peixaria': { name: '🥩 Talho & Peixaria', colorVar: '--category-talho-peixaria' },
    'despensa': { name: '🥫 Despensa', colorVar: '--category-despensa' },
    'limpeza-higiene': { name: '🧼 Limpeza & Higiene', colorVar: '--category-limpeza-higiene' },
    'congelados': { name: '🧊 Congelados', colorVar: '--category-congelados' },
    'outros': { name: '📦 Outros', colorVar: '--category-outros' }
};

function getCategoryDisplayName(key) {
    return categories[key] ? categories[key].name : key;
}

function getCategoryColorVar(key) {
    return categories[key] ? categories[key].colorVar : '';
}


// --- DOM Elements ---
const inventoryTabBtn = document.getElementById('inventory-tab');
const shoppingListTabBtn = document.getElementById('shopping-list-tab');
const inventorySection = document.getElementById('inventory-section');
const shoppingListSection = document.getElementById('shopping-list-section');

const newItemNameInput = document.getElementById('new-item-name');
const newItemCategorySelect = document.getElementById('new-item-category');
const addInventoryItemBtn = document.getElementById('add-inventory-item-btn');
const inventoryListDiv = document.getElementById('inventory-list');
const shoppingListDiv = document.getElementById('shopping-list');
const uncheckAllBtn = document.getElementById('uncheck-all-btn');
const clearAllBtn = document.getElementById('clear-all-btn');

const modalBackdrop = document.getElementById('modal-backdrop');
const customModal = document.getElementById('custom-modal');
const modalMessage = document.getElementById('modal-message');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

let currentModalCallback = null;

// --- Modal Functions ---
function showModal(message, callback) {
    modalMessage.textContent = message;
    currentModalCallback = callback;
    modalBackdrop.style.display = 'block';
    customModal.style.display = 'block';
}

function hideModal() {
    modalBackdrop.style.display = 'none';
    customModal.style.display = 'none';
    currentModalCallback = null;
}

modalConfirmBtn.addEventListener('click', () => {
    if (currentModalCallback) {
        currentModalCallback(true);
    }
    hideModal();
});

modalCancelBtn.addEventListener('click', () => {
    if (currentModalCallback) {
        currentModalCallback(false);
    }
    hideModal();
});

// --- Category Collapse/Expand ---
function toggleCategory(event) {
    const categoryGroup = event.currentTarget.closest('.category-group');
    if (!categoryGroup) return;

    // 1. Determine the context (inventory vs. shopping list)
    const listType = categoryGroup.closest('#inventory-list') ? 'inventory' : 'shoppingList';

    // 2. Get the category key
    let categoryKey = null;
    categoryGroup.classList.forEach(className => {
        if (className.startsWith('category-')) {
            categoryKey = className.replace('category-', '');
        }
    });

    if (!categoryKey) return;

    // 3. Toggle visual state
    const isCollapsing = !categoryGroup.classList.contains('collapsed');
    categoryGroup.classList.toggle('collapsed');

    // 4. Update the persistence object
    const list = collapsedCategories[listType];
    const index = list.indexOf(categoryKey);

    if (isCollapsing) {
        // Add to the list if it's not already there
        if (index === -1) {
            list.push(categoryKey);
        }
    } else {
        // Remove from the list if it exists
        if (index > -1) {
            list.splice(index, 1);
        }
    }

    // 5. Save the updated state to localStorage
    saveCollapsedCategories();
}


// --- Tab Navigation ---
inventoryTabBtn.addEventListener('click', () => {
    inventoryTabBtn.classList.add('active');
    shoppingListTabBtn.classList.remove('active');
    inventorySection.classList.add('active');
    shoppingListSection.classList.remove('active');
    renderInventory();
});

shoppingListTabBtn.addEventListener('click', () => {
    shoppingListTabBtn.classList.add('active');
    inventoryTabBtn.classList.remove('active');
    shoppingListSection.classList.add('active');
    inventorySection.classList.remove('active');
    renderShoppingList();
});


// --- Inventory Functions ---
function addInventoryItem() {
    const name = newItemNameInput.value.trim();
    const category = newItemCategorySelect.value;

    if (name && category) {
        inventory.push({ id: Date.now(), name, category });
        saveInventory();
        newItemNameInput.value = '';
        renderInventory();
    }
}

function deleteInventoryItem(id) {
    showModal('Tem certeza que deseja apagar este item do inventário?', (confirm) => {
        if (confirm) {
            inventory = inventory.filter(item => item.id !== id);
            saveInventory();
            renderInventory();
        }
    });
}

function moveItemToShoppingList(id) {
    const item = inventory.find(item => item.id === id);
    if (item && !shoppingList.some(sItem => sItem.id === id)) {
        shoppingList.push({ ...item, bought: false });
        saveShoppingList();
        renderInventory(); // Update inventory to show green background
        if (shoppingListTabBtn.classList.contains('active')) {
            renderShoppingList();
        }
    }
}

function renderInventory() {
    inventoryListDiv.innerHTML = '';
    const groupedItems = inventory.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {});

    Object.keys(groupedItems).sort().forEach(categoryKey => {
        const categoryGroupDiv = document.createElement('div');
        categoryGroupDiv.classList.add('category-group', `category-${categoryKey}`);

        // Check if the category should be collapsed
        if (collapsedCategories.inventory.includes(categoryKey)) {
            categoryGroupDiv.classList.add('collapsed');
        }

        const categoryTitleDiv = document.createElement('div');
        categoryTitleDiv.classList.add('category-title');
        categoryTitleDiv.textContent = getCategoryDisplayName(categoryKey);
        categoryTitleDiv.addEventListener('click', toggleCategory); // Add event listener
        categoryGroupDiv.appendChild(categoryTitleDiv);

        groupedItems[categoryKey].sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item', 'inventory-item');
            if (shoppingList.some(sItem => sItem.id === item.id)) {
                itemDiv.classList.add('in-shopping-list');
            }

            const itemNameSpan = document.createElement('span');
            itemNameSpan.classList.add('item-name');
            itemNameSpan.textContent = item.name;
            itemDiv.appendChild(itemNameSpan);

            const itemActionsDiv = document.createElement('div');
            itemActionsDiv.classList.add('item-actions');

            const addToListBtn = document.createElement('button');
            addToListBtn.classList.add('action-button', 'add-to-list');
            addToListBtn.textContent = '+';
            addToListBtn.addEventListener('click', () => moveItemToShoppingList(item.id));
            itemActionsDiv.appendChild(addToListBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('action-button', 'delete');
            deleteBtn.textContent = 'X';
            deleteBtn.addEventListener('click', () => deleteInventoryItem(item.id));
            itemActionsDiv.appendChild(deleteBtn);

            itemDiv.appendChild(itemActionsDiv);
            categoryGroupDiv.appendChild(itemDiv);
        });
        inventoryListDiv.appendChild(categoryGroupDiv);
    });
}

addInventoryItemBtn.addEventListener('click', addInventoryItem);


// --- Shopping List Functions ---
function toggleItemBought(id) {
    const itemIndex = shoppingList.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        shoppingList[itemIndex].bought = !shoppingList[itemIndex].bought;
        saveShoppingList();
        renderShoppingList();
        renderInventory(); // To update green background if item status changes
    }
}

function removeItemFromShoppingList(id) {
    showModal('Tem certeza que deseja remover este item da lista de compras?', (confirm) => {
        if (confirm) {
            shoppingList = shoppingList.filter(item => item.id !== id);
            saveShoppingList();
            renderShoppingList();
            renderInventory(); // To update green background
        }
    });
}

function uncheckAllShoppingListItems() {
    showModal('Tem certeza que deseja desmarcar todos os itens da lista de compras?', (confirm) => {
        if (confirm) {
            shoppingList.forEach(item => item.bought = false);
            saveShoppingList();
            renderShoppingList();
        }
    });
}

function clearAllShoppingListItems() {
    showModal('Tem certeza que deseja limpar toda a lista de compras? Esta ação é irreversível.', (confirm) => {
        if (confirm) {
            shoppingList = [];
            saveShoppingList();
            renderShoppingList();
            renderInventory(); // To clear all green backgrounds
        }
    });
}

function renderShoppingList() {
    shoppingListDiv.innerHTML = '';
    const groupedItems = shoppingList.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {});

    Object.keys(groupedItems).sort().forEach(categoryKey => {
        const categoryGroupDiv = document.createElement('div');
        categoryGroupDiv.classList.add('category-group', `category-${categoryKey}`);

        // Check if the category should be collapsed
        if (collapsedCategories.shoppingList.includes(categoryKey)) {
            categoryGroupDiv.classList.add('collapsed');
        }

        const categoryTitleDiv = document.createElement('div');
        categoryTitleDiv.classList.add('category-title');
        categoryTitleDiv.textContent = getCategoryDisplayName(categoryKey);
        categoryTitleDiv.addEventListener('click', toggleCategory); // Add event listener
        categoryGroupDiv.appendChild(categoryTitleDiv);

        // Separate bought from unbought, sort unbought then bought
        const itemsInThisCategory = groupedItems[categoryKey];
        const unboughtItems = itemsInThisCategory.filter(item => !item.bought).sort((a, b) => a.name.localeCompare(b.name));
        const boughtItems = itemsInThisCategory.filter(item => item.bought).sort((a, b) => a.name.localeCompare(b.name));

        [...unboughtItems, ...boughtItems].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item', 'shopping-list-item');
            if (item.bought) {
                itemDiv.classList.add('bought');
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('item-checkbox');
            checkbox.checked = item.bought;
            checkbox.addEventListener('change', () => toggleItemBought(item.id));
            itemDiv.appendChild(checkbox);

            const itemNameSpan = document.createElement('span');
            itemNameSpan.classList.add('item-name');
            itemNameSpan.textContent = item.name;
            itemDiv.appendChild(itemNameSpan);

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('action-button', 'remove');
            removeBtn.textContent = 'x';
            removeBtn.addEventListener('click', () => removeItemFromShoppingList(item.id));
            itemDiv.appendChild(removeBtn);

            categoryGroupDiv.appendChild(itemDiv);
        });
        shoppingListDiv.appendChild(categoryGroupDiv);
    });
}

uncheckAllBtn.addEventListener('click', uncheckAllShoppingListItems);
clearAllBtn.addEventListener('click', clearAllShoppingListItems);


// --- Initial Render ---
document.addEventListener('DOMContentLoaded', () => {
    renderInventory();
    renderShoppingList(); // Render both initially, so data is loaded
    // Ensure the correct tab content is shown based on initial active tab
    if (inventoryTabBtn.classList.contains('active')) {
        inventorySection.classList.add('active');
        shoppingListSection.classList.remove('active');
    } else {
        shoppingListSection.classList.add('active');
        inventorySection.classList.remove('active');
    }
});