// ==UserScript==
// @name         OPS YATES
// @version      1.1.1
// @description  Yet Another Torrent Editing Script
// @author       You
// @match        https://orpheus.network/torrents.php?id=*
// @exclude      https://orpheus.network/torrents.php?id=*action=editgroup*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/mahkitah/YATES/master/yates.user.js
// ==/UserScript==

(() => {
    'use strict';
    if (!document.querySelector('.sidebar')) return;

    GM_addStyle(`
        .gm-hide {
            display: none !important;
        }
        .gm-no-margin {
            margin: 0 !important;
        }
        .gm-edit-toggle {
            cursor: pointer;
            margin-left: 8px;
        }
        .gm-edit-toggle:hover {
            opacity: 0.7;
        }


        .gm-title-flex-wrapper {
            display: flex;
            justify-content: flex-start;
            flex-direction: column;
        }
        .gm-page-title {
            margin-left: 0 !important;
            margin-right: 0 !important;
        }
        .gm-title-mini-form {
            display: flex;
            gap: 10px;
            align-self: stretch;
            flex-direction: column;
            align-items: stretch;
            margin-bottom: 10px;
        }
        .gm-title-input {
            text-align: center;
            align-self: stretch;
            padding: 8px;
            font-size: inherit;
        }
        .gm-second-row {
            display: flex;
            justify-content: center;
            gap: 10px;
            align-items: center;
        }
        .gm-year-input {
            max-width: 75px;
        }
        .gm-rtype-select {
            padding: 8px;
        }


        .gm-cover-mini-form {
            display: flex;
            justify-content: flex-start;
            gap: 5px;
        }


        .gm-info-mini-form {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding-bottom: 15px;
            border: 2px solid;
            margin-bottom: 10px;
        }
        .gm-info-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 5px;
            margin-right: 10px;
        }
    `
    );
    const header = document.querySelector('div.header');
    const pageTitle = header.querySelector('h2');
    pageTitle.classList.add('gm-page-title');

    let editPageForm;
    let editFormData;

    // #region Title

    let titleMiniForm;
    let titleInput;
    let yearInput;
    let rTypeSelect;
    let titleSubmit;

    const titleEditToggle = createEditToggle('a');
    const titleFlexWrapper = Object.assign(document.createElement('div'), {
        className: 'gm-title-flex-wrapper'
    });

    pageTitle.append(titleEditToggle);

    titleFlexWrapper.append(pageTitle);
    header.prepend(titleFlexWrapper);

    titleEditToggle.addEventListener('click', async () => {
        if (!editFormData) await getEditForm();
        if (!titleMiniForm) createTitleMiniForm();

        const isHidden = titleMiniForm.classList.toggle('gm-hide');

        if (!isHidden) {
            titleInput.value = titleDecap(editFormData.get('name'));
            yearInput.value = editFormData.get('year');
            rTypeSelect.value = editFormData.get('releasetype');
            titleInput.focus();
            setTitleSubmitDisabled();
        };
    });

    function setTitleSubmitDisabled() {
        const unchanged =
            titleInput.value.trim() === editFormData.get('name') &&
            yearInput.value === editFormData.get('year') &&
            rTypeSelect.value === editFormData.get('releasetype');

        const validYear = 1940 <= Number(yearInput.value) && Number(yearInput.value) <= new Date().getFullYear() + 1;
        titleSubmit.disabled = unchanged || !validYear
    };

    const smallWords = new Set(['the', 'and', 'to', 'of', 'a', 'an', 'in', 'on',
        'at', 'for', 'by', 'from', 'as']);
    const separators = ['-', ':', '(', ')', '/'];
    function titleDecap(title) {
        return title.split(/\s+/).map((word, index, words) => {
            word = word.replaceAll('’', "'");
            if (index === 0 || index === words.length - 1) return word;
            if (separators.some(s => words[index - 1].endsWith(s))) return word;
            if (separators.some(s => words[index + 1].startsWith(s))) return word;
            const lowWord = word.toLowerCase();
            return smallWords.has(lowWord) ? lowWord : word;
        }).join(' ');
    }

    function createTitleMiniForm() {
        titleInput = Object.assign(editPageForm.querySelector('input[name="name"]'), {
            className: 'gm-no-margin gm-title-input',
        });

        yearInput = Object.assign(editPageForm.querySelector('input[name="year"]'), {
            type: 'number',
            className: 'gm-no-margin gm-year-input',
        });

        rTypeSelect = Object.assign(editPageForm.querySelector('#releasetype'), {
            className: 'gm-no-margin gm-rtype-select',
        });

        titleSubmit = Object.assign(document.createElement('input'), {
            type: 'submit',
            value: 'Edit',
            className: 'gm-title-submit-btn'
        });

        const secondRow = Object.assign(document.createElement('div'), {
            className: 'gm-second-row'
        });

        titleMiniForm = Object.assign(document.createElement('div'), {
            className: 'gm-title-mini-form gm-hide'
        });

        secondRow.append(yearInput, rTypeSelect, titleSubmit);
        titleMiniForm.append(titleInput, secondRow);

        titleSubmit.addEventListener('click', doEdit);
        titleInput.addEventListener('input', setTitleSubmitDisabled);
        yearInput.addEventListener('input', setTitleSubmitDisabled);
        yearInput.addEventListener('wheel', e => {
            e.preventDefault();
            let currenValue = Number(yearInput.value);
            if (e.deltaY > 0) {
                currenValue = Math.max(1940, currenValue - 1);
            }
            else if (e.deltaY < 0) {
                currenValue = Math.min(new Date().getFullYear() + 1, currenValue + 1);
            }
            yearInput.value = currenValue;
            yearInput.dispatchEvent(new Event('input'));
        });
        rTypeSelect.addEventListener('input', setTitleSubmitDisabled);
        rTypeSelect.addEventListener('wheel', e => {
            e.preventDefault();
            let currentIndex = rTypeSelect.selectedIndex;
            if (e.deltaY < 0) {
                currentIndex = Math.max(0, currentIndex - 1);
            }
            else if (e.deltaY > 0) {
                currentIndex = Math.min(rTypeSelect.options.length - 1, currentIndex + 1);
            }
            rTypeSelect.selectedIndex = currentIndex;
            rTypeSelect.dispatchEvent(new Event('input'));
        });

        titleFlexWrapper.append(titleMiniForm);
    }
    // #endregion

    // #region Cover

    let coverMiniForm;
    let imgLinkInput;
    let coverSubmit;

    const coverBoxHeader = document.querySelector('.box_albumart .head');
    const coverEditToggle = createEditToggle('strong');

    coverBoxHeader.append(coverEditToggle);

    coverEditToggle.addEventListener('click', async () => {
        if (!coverMiniForm) createCoverMiniForm();
        coverMiniForm.classList.toggle('gm-hide');
    });

    function createCoverMiniForm() {
        coverMiniForm = Object.assign(document.createElement('div'), {
            className: 'gm-cover-mini-form gm-hide pad',
        });

        imgLinkInput = Object.assign(document.createElement('input'), {
            className: 'gm-no-margin',
            type: 'text',
            placeholder: 'https://imghost.com/1235.jpg',
            title: 'Enter HTTPS image URL (jpg/jpeg/png/webm)',
            size: '25',
        });

        coverSubmit = Object.assign(document.createElement('input'), {
            className: 'gm-no-margin',
            type: 'submit',
            value: 'Set',
            disabled: true,
        });

        coverBoxHeader.after(coverMiniForm);
        coverMiniForm.appendChild(imgLinkInput)
        coverMiniForm.appendChild(coverSubmit)

        const imgUrlPattern = new RegExp('^https://\\S+\\.(?:jpg|jpeg|png|webm)$')
        imgLinkInput.addEventListener('input', () => coverSubmit.disabled = !imgLinkInput.value.match(imgUrlPattern))
        coverSubmit.addEventListener('click', doEdit)
    }

    // #endregion

    // #region Info

    let infoMiniForm;
    let infoEditTextArea
    let oriBBtext;
    let previewBtn;
    let lastPreviewedBBtext;

    const infoBox = document.querySelector('.torrent_description');
    const infoHeader = infoBox.querySelector('.head');
    const InfoEditToggle = createEditToggle('strong');
    infoHeader.append(InfoEditToggle);

    InfoEditToggle.addEventListener('click', async () =>{
        if (!editFormData) await getEditForm();
        if (!infoMiniForm) {
            createInfoMiniForm();
            oriBBtext = editFormData.get('body');
        };

        const isHidden = infoMiniForm.classList.toggle('gm-hide');

        if (!isHidden) {
            if (infoEditTextArea.classList.contains('gm-hide')) {
                previewBtn.click();
            };
            infoEditTextArea.value = oriBBtext;
            fitHeight();
        };

    });

    function createInfoMiniForm() {
        infoMiniForm = Object.assign(document.createElement('div'), {
            className: 'gm-info-mini-form gm-hide',
        });

        infoEditTextArea = Object.assign(document.createElement('textarea'), {
            className: 'gm-info-edit',
        });

        const previewArea = Object.assign(document.createElement('div'), {
            className: 'body gm-hide',
            id: 'gm-preview'
        });
        const buttonRow = Object.assign(document.createElement('div'), {
            className: 'gm-info-buttons'
        });
        const infoSubmit = Object.assign(document.createElement('input'), {
            type: 'submit',
            value: 'Submit',
            disabled: true,
            className: 'gm-submit-btn'
        });

        previewBtn = Object.assign(document.createElement('button'), {
            textContent: 'Preview',
            className: 'gm-preview-btn'
        });

        infoMiniForm.append(previewArea, infoEditTextArea, buttonRow);
        buttonRow.append(infoSubmit, previewBtn);
        infoHeader.after(infoMiniForm);

        infoEditTextArea.addEventListener('input', () => fitHeight());
        infoEditTextArea.addEventListener('input', () => infoSubmit.disabled = (infoEditTextArea.value === oriBBtext));
        infoSubmit.addEventListener('click', doEdit);

        previewBtn.addEventListener('click', async () => {
            const isHidden = previewArea.classList.contains('gm-hide');
            if (isHidden) {
                if (lastPreviewedBBtext !== infoEditTextArea.value) {
                    const previewHTML = await getPreviewHTML();
                    previewArea.innerHTML = previewHTML;
                    lastPreviewedBBtext = infoEditTextArea.value;
                }
                previewBtn.textContent = 'Editor';
            } else {
                previewBtn.textContent = 'Preview';
            }
            previewArea.classList.toggle('gm-hide');
            infoEditTextArea.classList.toggle('gm-hide');
        })
    };

    async function getPreviewHTML() {
        return await fetch('/ajax.php?action=preview', {
            method: 'POST',
            body: new URLSearchParams({body: infoEditTextArea.value}),
        }).then(r => r.text())
    };

    function fitHeight() {
        infoEditTextArea.style.height = 'auto';
        infoEditTextArea.style.height = infoEditTextArea.scrollHeight + 10 + 'px';
    }

    // #endregion

    // #region General

    function createEditToggle(type) {
        return Object.assign(document.createElement(type), {
            textContent: 'Ⓔ',
            className: 'gm-edit-toggle',
        });
    }

    async function getEditForm() {
        const groupId = new URL(location.href).searchParams.get('id');
        const resp = await fetch(`/torrents.php?action=editgroup&id=${groupId}`);
        const html = await resp.text();
        editPageForm = new DOMParser().parseFromString(html, 'text/html').querySelector('form[name="torrent_group"]');
        editFormData = new FormData(editPageForm);
    };

    async function doEdit(e) {
        e.preventDefault();
        e.target.disabled = true;
        if (!editFormData) await getEditForm();

        const editParams = {};

        if (titleMiniForm && !titleMiniForm.classList.contains('gm-hide')) {
            const newTitle = titleInput.value.trim();
            if (newTitle && newTitle !== editFormData.get('name')) editParams.name = newTitle;

            const newYear = yearInput.value.trim();
            if (newYear && newYear !== editFormData.get('year')) editParams.year = newYear;

            if (rTypeSelect.value !== editFormData.get('releasetype')) editParams.releasetype = rTypeSelect.value;
        };

        if (coverMiniForm && !coverMiniForm.classList.contains('gm-hide')) {
            let newImgLink = imgLinkInput.value.trim();
            if (newImgLink && newImgLink !== editFormData.get('image')) {
                if (GM_getValue('rarehost', false)) {
                    const userList = GM_getValue('whitelist', '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => Boolean(s.trim()));
                    const whiteList = ["thesungod.xyz"].concat(userList);
                    if (!whiteList.some(x => newImgLink.includes(x))) {
                        newImgLink = await raRehost(newImgLink);
                    };
                }
                editParams.image = newImgLink
            };
        };

        if (infoMiniForm && !infoMiniForm.classList.contains('gm-hide')) {
            const infoText = infoEditTextArea.value;
            if (infoText && infoText !== oriBBtext) editParams.body = infoText;
        }

        try {
            if (Object.keys(editParams).length === 0) {
                await new Promise(r => setTimeout(r, 100));
            } else {
                await editTorrentGroup(editParams);
                if (GM_getValue('reload', true)) location.reload();
            }
        } catch (error) {
            console.error('Edit failed:', error);
        } finally {
            e.target.disabled = false;
        };
    }

    async function editTorrentGroup(formParams) {
        try {
            for (const [key, value] of Object.entries(formParams)) {
                editFormData.set(key, value);
            }
            const submitResponse = await fetch('/torrents.php', {
                method: 'POST',
                body: editFormData,
            });

            if (!submitResponse.ok) {
                throw new Error(`Edit failed. Status: ${submitResponse.status}`);
            }

        } catch (error) {
            console.error('Error editing group:', error);
            alert('Error editing group. Sufficient permissions?');
        }
    }

    async function raRehost(imgLink) {
        console.log('rehostfunc', imgLink)
        const url = "https://thesungod.xyz/api/image/rehost_new";
        const payload = new URLSearchParams({
            'api_key': GM_getValue('rapikey', ''),
            'link': imgLink,
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: payload,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const respJ = await response.json();
            return respJ.link;
        }
        catch (error) {
            console.error("Rehosting failed:", error);
            throw error;
        }
    }
    // #endregion

    // #region Settings

    GM_addStyle(`
        #yates-settings-panel {
            position: fixed !important;
            top: 50px !important;
            right: 20px !important;
            height: unset !important;
            width: 350px;
            border: 2px solid !important;
            z-index: 999999 !important;
        }
        #yates-settings-content {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 10px !important;
        }
        .setting-line {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        #yates-settings-content input[type="text"] {
            flex-grow: 1;
        }
        #settings-buttons {
            text-align: right !important;
        }
    `);

    const settingNames = {
        reload: ['checked', true],
        rarehost: ['checked', false],
        rapikey: ['value', ''],
        whitelist: ['value', ''],
    }
    let panel = null;

    function loadSettings() {
        for (const [settingName, [attr, def]] of Object.entries(settingNames)) {
            panel.querySelector(`#${settingName}`)[attr] = GM_getValue(settingName, def)
        }
    }

    function saveSettings() {
        for (const [settingName, [attr, def]] of Object.entries(settingNames)) {
            GM_setValue(settingName, panel.querySelector(`#${settingName}`)[attr])
        }
        panel.remove();
        panel = null;
    }

    function unsavedChanges() {
        for (const [settingName, [attr, def]] of Object.entries(settingNames)) {
            if (GM_getValue(settingName, def) !== panel.querySelector(`#${settingName}`)[attr]) return true;
        }
        return false;
    };

    function createPanel() {
        panel = Object.assign(document.createElement('div'), {
            id: 'yates-settings-panel',
            className: 'sidebar',
        });

        const wlistHelp = 'Domain names, comma separated'

        panel.innerHTML = `
            <div class="box gm-no-margin" id="settings-box">
                <div class="head pad" id="settings-title">
                    <strong>YATES Settings</strong>
                </div>
                <div id="yates-settings-content">
                    <div class="setting-line">
                        <input type="checkbox" id="reload">
                        <label for="reload">Reload page after edit</label>
                    </div>
                    <div class="setting-line">
                        <input type="checkbox" id="rarehost">
                        <label for="rarehost">Rehost new cover images to Ra</label>
                    </div>
                    <div class="setting-line">
                        <label for="rapikey">Ra api key:</label>
                        <input type="text" class="gm-no-margin" id="rapikey">
                    </div>
                    <div class="setting-line">
                        <label>Don't rehost:</label>
                        <input type="text" class="gm-no-margin" id="whitelist" placeholder="${wlistHelp}" title="${wlistHelp}">
                    </div>
                </div>
                <div id="settings-buttons">
                    <button id="saveBtn">Save</button>
                    <button id="closeBtn">Close</button>
                </div>
            </div>
        `;
        document.body.append(panel);

        panel.querySelector('#saveBtn').addEventListener('click', saveSettings);
        panel.querySelector('#closeBtn').addEventListener('click', toggleSettings);
        loadSettings();
    }
    function toggleSettings() {
        if (panel) {
            if (unsavedChanges() && !confirm('Close without saving changes?')) return;
            panel.remove();
            panel = null;
        } else {
            createPanel();
        }
    }
    GM_registerMenuCommand('⚙️ Settings', toggleSettings);

    // #endregion
})();