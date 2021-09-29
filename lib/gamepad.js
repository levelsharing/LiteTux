/* Constants for the standard gamepad buttons using xbox terminology */
GAMEPAD_BUTTONS = {
    "A": 0,
    "B": 1,
    "X": 2,
    "Y": 3,
    "LB": 4,
    "RB": 5,
    "LTrigger": 6,
    "RTrigger": 7,
    "Back": 8,
    "Start": 9,
    "LeftStickButton": 10,
    "RightStickButton": 11,
    "DPadUp": 12,
    "DPadDown": 13,
    "DPadLeft": 14,
    "DPadRight": 15
};

/**
 * A utility for combining keyboard and attached joysticks into a virtual single
 * joystick with keys mapped to particular joystick buttons
 */
class VirtualGamepad {
    constructor() {
        // keyboard map
        this.keyboardMap = [
            ["Control", " ", "M", "m"],	// 0 = A
            ["Shift", "K", "k"],		// 1 = B
            ["J", "j"],					// 2 = X
            ["i", "I"], 				// 3 = Y
            ["[", "{"],					// 4 = LB
            ["]", "}"],					// 5 = RB
            ["-", "_"],					// 6 = LTrigger
            ["=", "+"],					// 7 = RTrigger
            ["Backspace"], 				// 8 = Back
            ["Enter"], 					// 9 = Start
            ["`", "~"],					// 10 = Left Stick down
            ["\\", "|"],				// 11 = Right Stick down
            ["w", "W", "ArrowUp"],		// 12 = DPad up
            ["s", "S", "ArrowDown"],	// 13 = DPad down
            ["a", "A", "ArrowLeft"],	// 14 = DPad left
            ["d", "D", "ArrowRight"]	// 15 = DPad right
        ];
        this.keysDown = [];
        this.guiButtonMap = [];
        for (let cntr = 0; cntr < this.keyboardMap.length; ++cntr) {
            this.guiButtonMap.push([]);
        }
    }

    addGUIButton(btnID, button) {
        this.guiButtonMap[btnID].push(button)
    }

    keyDown(key) {
        if ( ! this.keysDown.includes(key)) {
            this.keysDown.push(key);
            console.log(`adding ${key}`);
        }
    }

    keyUp(key) {
        console.log(`key pressed ${key}`);
        let indx = this.keysDown.indexOf(key);
        if (indx >= 0) {
            this.keysDown.splice(indx, 1);
        }
    }

    isButtonDown(btnID) {
        let buttonDown = false;

        // keyboard check
        if (btnID < this.keyboardMap.length) {
            for (let k = 0; k <  this.keyboardMap[btnID].length; ++k) {
                if (this.keysDown.includes(this.keyboardMap[btnID][k])) {
                    buttonDown = true;
                    break;
                }
            }
        }

        // GUI Buttons check
        if ( ( ! buttonDown) && ( btnID < this.guiButtonMap.length) ) {
            for (let k = 0; k <  this.guiButtonMap[btnID].length; ++k) {
                if (this.guiButtonMap[btnID][k]._isDown) {
                    buttonDown = true;
                    break;
                }
            }
        }

        // loop through all gamepads and see if desired key is down
        if (!buttonDown) {
            let gamepads = navigator.getGamepads();
            for (let cntr = 0; cntr < gamepads.length; ++cntr) {
                if (gamepads[cntr] != null) {
                    console.log("processing gamepad " + cntr);
                    let gp = gamepads[cntr];
                    if (gp.buttons.length > btnID)
                        if (gp.buttons[btnID].pressed) {
                            buttonDown = true;
                            break;
                        }
                }
            }
        }
        return buttonDown
    }

}
