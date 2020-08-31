const timeEntries = [
    {label: "AM", in: "8:30", out: "12:00", outReason: "Meal"},
    {label: "PM", in: "12:30", out: "17:00", outReason: "Out"},
];

function findLabel(labelText) {
    return document.evaluate(
            "//label[@data-automation-id='formLabel' and text()='"+ labelText +"']",
            document.body,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null)
        .singleNodeValue;
}

function findInput(labelText) {
    var label = findLabel(labelText);
    if (label) {
        var input = document.evaluate(
                "//*[@aria-labelledby='"+ label.id +"']",
                label.parentElement.parentElement,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null)
            .singleNodeValue;
        return input;
    }
    return null;
}

function fillInput(labelText, value) {
    var input = findInput(labelText);
    if (input) {
        input.value = value;
        return input;
    }
}

function fillCombo(labelText, value) {
    const input = findInput(labelText);
    if (input) {
        const selectedOption = document.evaluate(
                "//div[@data-automation-id='selectSelectedOption']",
                input,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null)
            .singleNodeValue;
        if (selectedOption) {
            selectedOption.innerHTML = value;
        }
        return selectedOption;
    }
    return null;
}

function findDialog(element) {
    do {
        element = element.parentElement;
    } while (element && element.getAttribute('role') != 'dialog');
    return element
}

function autofill(timeEntryIndex) {
    const timeEntry = timeEntries[timeEntryIndex];

    const outReason = fillCombo("Out Reason", timeEntry.outReason);
    const inInput = fillInput("In", timeEntry.in);
    const outInput = fillInput("Out", timeEntry.out);
    inInput.focus();
    outInput.focus();
    outReason.focus();
    inInput.focus();
    const dialog = findDialog(outInput);
    if (dialog) {
        const okButton = document.evaluate(
                "//button[@title='OK']",
                dialog,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null)
            .singleNodeValue;
        if (okButton) {
            okButton.click();
        }
    }

}

const observer = new MutationObserver(function(mutationsList) {
    for (let mutation of mutationsList) {
        if (mutation.addedNodes) {
            for (let addedNode of mutation.addedNodes) {
                if (addedNode.nodeType == Node.ELEMENT_NODE && addedNode.getAttribute("data-automation-id") == "dropDownCommandButton") {
                    const toolbar = document.evaluate(
                        "./ancestor::div[@data-automation-id='toolbarButtonContainer']",
                        addedNode,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null)
                    .singleNodeValue;
                    if (toolbar && findDialog(toolbar)) {
                        const existingButtons = document.evaluate(
                            "//button[@class='timeEntry']",
                            toolbar,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null)
                        .singleNodeValue;
                        if (!existingButtons) {
                            for (let i in timeEntries) {
                                const timeEntry = timeEntries[i];
                                const button = document.createElement("button");
                                button.innerHTML = timeEntry.label;
                                button.onclick = function() {
                                    autofill(i);
                                };
                                button.className = 'timeEntry';
                                toolbar.appendChild(button);
                            }
                        }
                    }
                }
            }
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });
