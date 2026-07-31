const RIGHT_ARROW_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAuUlEQVR4nO3XTQrCMBCG4bmExdz/KkJBXdlFj/NKoSgWhWr+ZvB7VyEhkIesxkwppZRSSilVIGAATsBlWVvEgANw49kMJAv4E9MKmDbrIeJPzMDxzV4Kh7DPZykcIgyGHQj3GL5AuMXwA8IdhgyEGwwFEN0xFER0w1AB0RxDRUQzDA0Q1TE0RFTD9EAUx/REFMN4QGRjPCGyMOt87W6a43XqPO+5MAJXT4gNZnnb+NhUSimllFLq77oDYPHP2YLmYzwAAAAASUVORK5CYII=';

function createToggleSwitch(checked) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'switch';
    btn.setAttribute('aria-checked', checked ? 'true' : 'false');
    btn.style.cssText = 'display:inline-flex;align-items:center;width:36px;height:20px;padding:2px;border:none;border-radius:10px;cursor:pointer;background:' + (checked ? '#ffff00' : 'rgba(255,255,255,0.15)') + ';transition:background .35s cubic-bezier(.4,0,.2,1);flex-shrink:0;';
    var knob = document.createElement('div');
    knob.style.cssText = 'width:16px;height:16px;border-radius:50%;background:' + (checked ? '#000' : '#fff') + ';transition:transform .35s cubic-bezier(.4,0,.2,1),background .35s cubic-bezier(.4,0,.2,1);' + (checked ? 'transform:translateX(16px)' : '');
    btn.appendChild(knob);
    return btn;
}

function setMenuItemToggle(titleId, state) {
    var el = document.querySelector('[data-title-id="' + titleId + '"]');
    if (!el) return;
    var toggle = el.querySelector('[role="switch"]');
    if (!toggle) return;
    toggle.setAttribute('aria-checked', state ? 'true' : 'false');
    toggle.style.background = state ? '#ffff00' : 'rgba(255,255,255,0.15)';
    var knob = toggle.querySelector('div');
    if (knob) {
        knob.style.transform = state ? 'translateX(16px)' : '';
        knob.style.background = state ? '#000' : '#fff';
    }
}

function createNavTab(title, path) {
    let a = document.createElement('a');
    a.className = 'buOTZq_TKQOVyjMLrXvB ZfF8mQ3Iftpwu0aZgDtG yWJHrpNsBvchs9Jjyokk';
    a.setAttribute('data-name', path);
    a.textContent = title;
    a.href = path;
    return a;
}

function createDropdown(data) {
    let dropdown = document.createElement('div');
    dropdown.className = 'ymt_dropdown';

    let buttons = document.createElement('span');
    buttons.className = 'ymt_dropdown-buttons';
    buttons.append(createButton(data.button));

    if (data.secondaryButton) {
        buttons.append(createButton(data.secondaryButton));
    }

    dropdown.append(buttons);

    data.menus.forEach(function (menuData) {
        dropdown.append(createMenu(menuData));
    });

    let style = document.createElement('style');
    style.textContent = [
        '.ymt_dropdown > ::-webkit-scrollbar { width: 0px; }',
        '.ymt_dropdown > ::-moz-scrollbar { width: 0px; }',
        '.ymt_menu_width { width: ' + data.width + 'px; }',
        '.ymt_dropbtn { border: none; cursor: pointer; background: transparent; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; }',
        '.ymt_dropbtn:hover { background-color: rgba(255, 255, 255, 0.1); }',
        '.ymt_dropbtn .ymt_btn_label { font-size: 14px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; color: #fff; }',
        '.ymt_dropdown-buttons { display: inline-flex; align-items: center; }',
        '.ymt_dropdown { text-align: left; position: relative; display: inline-block; z-index: 77; }',
        '.ymt_dropdown-content { display: none; position: absolute; top: calc(100% + 14px); min-width: 160px; background: #282828; border-radius: 12px; padding: 6px 0; box-shadow: 0 10px 20px -5px rgba(0, 0, 0, .4); z-index: 78; }',
        '.ymt_dropdown-content li { padding: 10px 16px; text-decoration: none; display: block; color: #fff; cursor: pointer; font-size: 14px; border-radius: 8px; margin: 0 6px; }',
        '.ymt_dropdown-content li:hover { background-color: rgba(255, 255, 255, 0.1); }',
        '.ymt_show { display: block; }',
        '.ymt_header { border-bottom-width: 1px; border-bottom-style: solid; border-color: #e5e5e545; }',
        '.ymt_menu_has_children { position: relative; }',
        '.ymt_menu_has_children:hover > .ymt_submenu { display: block; }',
        '.ymt_submenu { display: none; position: absolute; left: calc(100% + 4px); top: -6px; min-width: 140px; background: #282828; border-radius: 10px; padding: 4px 0; box-shadow: 0 8px 16px -4px rgba(0,0,0,.5); z-index: 79; }',
        '.ymt_submenu li { padding: 8px 14px; font-size: 13px; color: #fff; cursor: pointer; border-radius: 6px; margin: 0 4px; white-space: nowrap; }',
        '.ymt_submenu li:hover { background: rgba(255,255,255,0.1); }',
    ].join(' ');

    let root = document.createElement('span');
    root.id = data.id;
    root.append(dropdown);
    root.append(style);

    return root;
}

function createButton(data) {
    let button = document.createElement('button');
    if (data.hasOwnProperty('id')) {
        button.id = data.id;
    }
    button.className = 'cpeagBA1_PblpJn8Xgtv qU2apWBO1yyEK0lZ3lPO IlG7b1K0AD7E7AMx6F5p ymt_dropbtn';
    button.addEventListener('click', data.handler);

    if (data.icon) {
        let img = document.createElement('img');
        img.src = data.icon;
        img.style.cssText = 'width:24px; height:24px; pointer-events:none;';
        button.append(img);
    } else {
        let span = document.createElement('span');
        span.className = 'JjlbHZ4FaP9EAcR_1DxF ymt_btn_label';
        span.textContent = data.title;
        button.append(span);
    }

    let wrapper = document.createElement('span');
    wrapper.style.cssText = 'margin-left: 0.5rem; margin-right: 0.5rem;';
    wrapper.append(button);

    return wrapper;
}

function createMenu(data) {
    let ul = document.createElement('ul');
    ul.id = data.id;
    ul.className = 'ymt_menu_width ymt_dropdown-content';

    for (let i = 0; i < data.items.length; i++) {
        let item = data.items[i];
        let li = document.createElement('li');

        if (item.hasOwnProperty('children')) {
            li.className = 'ymt_menu_has_children';
            li.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
            let titleText = typeof item.title === 'function' ? item.title() : item.title;
            var titleSpan = document.createElement('span');
            titleSpan.textContent = titleText;
            li.appendChild(titleSpan);
            var arrowImg = document.createElement('img');
            arrowImg.src = RIGHT_ARROW_IMG;
            arrowImg.style.cssText = 'width:12px;height:12px;object-fit:contain;transform:rotate(90deg);opacity:0.6;flex-shrink:0;';
            li.appendChild(arrowImg);
            let subUl = document.createElement('ul');
            subUl.className = 'ymt_submenu';
            for (let j = 0; j < item.children.length; j++) {
                let subItem = item.children[j];
                let subLi = document.createElement('li');
                if (subItem.hasOwnProperty('titleId')) subLi.setAttribute('data-title-id', subItem.titleId);
                subLi.textContent = typeof subItem.title === 'function' ? subItem.title() : subItem.title;
                subLi.addEventListener('click', subItem.handler);
                subUl.append(subLi);
            }
            li.append(subUl);
        } else {
            if (item.hasOwnProperty('header')) {
                addMenuHeader(li, item);
            } else if (item.hasOwnProperty('title')) {
                let titleText = typeof item.title === 'function' ? item.title() : item.title;
                if (item.toggle) {
                    li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
                    var labelSpan = document.createElement('span');
                    labelSpan.textContent = titleText;
                    li.appendChild(labelSpan);
                    li.appendChild(createToggleSwitch(item.defaultState !== undefined ? item.defaultState : false));
                } else {
                    li.textContent = titleText;
                }
                if (item.hasOwnProperty('titleId')) li.setAttribute('data-title-id', item.titleId);
            }
            li.addEventListener('click', item.handler);
        }

        ul.append(li);
    }

    return ul;
}

function updateMenuItemTitle(titleId, newText) {
    var el = document.querySelector('[data-title-id="' + titleId + '"]');
    if (el) el.textContent = newText;
}

function addMenuHeader(li, item) {
    let icon = document.createElement('span');

    let title = document.createElement('span');
    if (item.hasOwnProperty('titleId')) {
        title.id = item.titleId;
    }
    if (item.hasOwnProperty('title')) {
        title.textContent = item.title;
    }

    li.className += ' ymt_header';
    li.append(icon);
    li.append(title);
}
