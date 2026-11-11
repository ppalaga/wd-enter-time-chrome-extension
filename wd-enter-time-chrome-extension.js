const timeEntries = [
    {
        label: "8h",
        fields: [
            {
                key: "Hours",
                value: "8",
                fillFunction: fillInput
            },
            {
                key: "Comment",
                value: "foo",
                fillFunction: fillInput
            }
        ]
    },
    {
        label: "AM",
        fields: [
            {
                key: "In",
                value: "8:30",
                fillFunction: fillInput
            },
            {
                key: "Out",
                value: "12:00",
                fillFunction: fillInput
            },
            {
                key: "Out Reason",
                value: "Meal",
                fillFunction: fillCombo
            }
        ]
    },
    {
        label: "PM",
        fields: [
            {
                key: "In",
                value: "12:30",
                fillFunction: fillInput
            },
            {
                key: "Out",
                value: "17:00",
                fillFunction: fillInput
            },
            {
                key: "Out Reason",
                value: "Out",
                fillFunction: fillCombo
            }
        ]
    }
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
        var input = document.getElementById(label['htmlFor']);
        if (input) {
            return input;
        }
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
    console.log("Found input ");
    console.log(input);
    if (input) {
        for (var i = 0; i < value.length; i++) {
            console.log("pressing " + value.charAt(i));
            input.dispatchEvent(new KeyboardEvent('keydown', {key: value.charAt(i), keyCode: value.charCodeAt(i), isTrusted: true}));
//            input.dispatchEvent(new KeyboardEvent('keyup', {'key': value.charAt(i), code: "Numpad8"}));
//            input.dispatchEvent(new KeyboardEvent('keypress', {'key': value.charAt(i), code: "Numpad8"}));
        }
        console.log("Input value = " + input.value);

        return input;
    }
}

function fillCombo(labelText, value) {
    const input = findInput(labelText);
    console.log("Found input ");
    console.log(input);
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
    var firstField;
    for (const fld of timeEntry.fields) {
        const func = fld.fillFunction;
        const field = func(fld.key, fld.value);
        field.focus();
        if (!firstField) {
            firstField = field;
        }
    }
    if (firstField) {
        firstField.focus();
    }
    const dialog = findDialog(firstField);
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
