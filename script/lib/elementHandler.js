function toggleDropdown(id) {
    let el = document.getElementById(id);
    if (el) {
        el.classList.toggle('ymt_show');
    }
}

function onClickOutsideDropdown(event) {
    let dropdown = document.querySelector('.ymt_dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        closeDropdownAll();
    }
}

function onClickButtonDropdown(id) {
    if (!closeDropdownAll()) {
        toggleDropdown(id);
    }
}

function closeDropdownAll() {
    let closed = false;
    let dropdowns = document.getElementsByClassName('ymt_dropdown-content');
    for (let i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].classList.contains('ymt_show')) {
            dropdowns[i].classList.remove('ymt_show');
            closed = true;
        }
    }
    return closed;
}
