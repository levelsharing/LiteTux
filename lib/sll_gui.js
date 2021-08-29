// SLL_GUI requires SLL
// noinspection JSUnusedGlobalSymbols

SLL_BUTTON_STATES = {
	"UP" : 0,
	"OVER" : 1,
	"DOWN" : 2,
	"DISABLED" : 3
}
 SLL_BUTTON_COLOR = {
	"BACK" : 0,
	"TEXT" : 1,
	"TEXT_HIGHLIGHT" : 2,
	"BORDER_TOP" : 3,
	"BORDER_BOTTOM" : 4
 }
 
class SLLTextButton extends SLLLayer {
	constructor(lid, rect, message, border = 5) {
		super(lid, rect.width, rect.height);
		this.moveTo(rect.x, rect.y);
		this.border = border;
		this._backgroundColor = "#008";
		this.colorSet = [ 	["#008", "#880", "#000", "#00C", "#004"], // up
							["#088", "#880", "#000", "#0CC", "#044"], // over
							["#800", "#880", "#000", "#400", "#C00"], // down
							["#555", "#CCC", "#000", "#888", "#222"] ]; // disable
		
		let gap = Math.floor(rect.height / 5);
		this.message = new SLLTextLayer(lid+"_txt", 
				new SLLRectangle(border,gap, rect.width - border*2, gap*3), message);
		this.message.setAlignment("center");
		this.message.setFont(gap*3, "sans-serif", false, false, true, true);
		this.addChild(this.message);
		this.state = SLL_BUTTON_STATES.UP;
		this._isDown = false;
		this.onClickHandler = null;
	}
	
	drawSelf(ctx, bounds, drawOutsideBounds = false)
	{
		if (this.findRealPosition().intersects(bounds) === false)
			return bounds;
		if (this._visible) {
			this.message.setColor(this.colorSet[this.state][SLL_BUTTON_COLOR.TEXT],
					this.colorSet[this.state][SLL_BUTTON_COLOR.TEXT_HIGHLIGHT]);
			// save state and clip to prevent drawing outside bounds
			ctx.save();
			let oldFill = ctx.fillStyle;
			let oldStroke = ctx.strokeStyle;
			this.findRealPosition();
			let rect = this._realPosition.getIntersection(bounds);
			if ( ! drawOutsideBounds) {
				ctx.rect(rect.x, rect.y, rect.width, rect.height)
				ctx.clip();
			}

			// figure out scaling
			let scaleX = this._realPosition.width / this._logicalPosition.width;
			let scaleY = this._realPosition.height / this._logicalPosition.height;
			let borderSize = Math.ceil(this.border * scaleY);
			
			// draw button face
			ctx.fillStyle = this.colorSet[this.state][SLL_BUTTON_COLOR.BACK];
			ctx.fillRect(this._realPosition.x + borderSize, 
					this._realPosition.y + borderSize,
					this._realPosition.width - 2*borderSize, 
					this._realPosition.height - 2*borderSize);
			// draw bottom border
			let x1 = this._realPosition.x;
			let y1 = this._realPosition.y;
			let x2 = x1 + this._realPosition.width - 1;
			let y2 = y1 + this._realPosition.height - 1;
			ctx.strokeStyle = this.colorSet[this.state][SLL_BUTTON_COLOR.BORDER_BOTTOM];
			for (let cntr = 0; cntr < borderSize; ++cntr) {
				ctx.beginPath();
				ctx.moveTo(x1+cntr, y1+cntr);
				ctx.lineTo(x1+cntr, y2-cntr);
				ctx.lineTo(x2-cntr, y2-cntr);
				ctx.stroke();
			}
			ctx.strokeStyle = this.colorSet[this.state][SLL_BUTTON_COLOR.BORDER_TOP];
			for (let cntr = 0; cntr < borderSize; ++cntr) {
				ctx.beginPath();
				ctx.moveTo(x1+cntr, y1+cntr);
				ctx.lineTo(x2-cntr, y1+cntr);
				ctx.lineTo(x2-cntr, y2-cntr);
				ctx.stroke();
			}
			

			ctx.fillStyle = oldFill;
			ctx.strokeStyle = oldStroke;
			ctx.restore();
		}
		
		return bounds;
	}

	mouseDown(x, y) {
		if (this.state === SLL_BUTTON_STATES.DISABLED)
			return false;
		let real = this.findRealPosition();
		let oldState = this.state
		if (real.containsCoordinate(x,y)) {
			this.state = SLL_BUTTON_STATES.DOWN;
			this._isDown = true;
		}
		return this.state !== oldState;
	}
	
	mouseMove(x, y) {
		if (this.state === SLL_BUTTON_STATES.DISABLED)
			return false;
		let real = this.findRealPosition();
		let oldState = this.state
		if (real.containsCoordinate(x,y))
			if (this._isDown)
				this.state = SLL_BUTTON_STATES.DOWN;
//				this.setBackgroundColor(this.downColors[SLL_BUTTON_COLOR.BACK]);
			else
				this.state = SLL_BUTTON_STATES.OVER;
//				this.setBackgroundColor(this.overColors[SLL_BUTTON_COLOR.BACK]);
		else
			this.state = SLL_BUTTON_STATES.UP;
			//this.setBackgroundColor(this.upColors[SLL_BUTTON_COLOR.BACK]);
		
		return this.state !== oldState;
	}
	
	mouseUp(x,y) {
		if (this.state === SLL_BUTTON_STATES.DISABLED)
			return false;
		let real = this.findRealPosition();
		let oldState = this.state
		if (real.containsCoordinate(x,y)) {
			if ((this._isDown) && (this.onClickHandler != null))
				this.onClickHandler.buttonClicked(this);
			if (this.state !== SLL_BUTTON_STATES.DISABLED)
				this.state = SLL_BUTTON_STATES.OVER;
		} else {
			this.state = SLL_BUTTON_STATES.UP;
		}

		this._isDown = false;
		return oldState !== this.state;
	}

	setClickHandler(handler) {
		this.onClickHandler = handler;
	}
	
	setColor(state, back, txt, txtHighlight, borderTop, borderBot) {
		this.colorSet[state][SLL_BUTTON_COLOR.BACK] = back;
		this.colorSet[state][SLL_BUTTON_COLOR.TEXT] = txt;
		this.colorSet[state][SLL_BUTTON_COLOR.TEXT_HIGHLIGHT] = txtHighlight;
		this.colorSet[state][SLL_BUTTON_COLOR.BORDER_TOP] = borderTop;
		this.colorSet[state][SLL_BUTTON_COLOR.BORDER_BOTTOM] = borderBot;
	}
	
	setDisabled(b) {
		if (b)
			this.state = SLL_BUTTON_STATES.DISABLED;
		else if (this.state === SLL_BUTTON_STATES.DISABLED)
			this.state = SLL_BUTTON_STATES.UP;
		console.log(`button ${this.id} state ${this.state}`);
	}
	
	setText(txt) {
		this.message.setText(txt);
	}
}


// ---------------------------------------------------------------

class SLLImageButton extends SLLTextButton {
	constructor(lid, img, rect, border = 0) {
		let borderedRect = new SLLRectangle(rect.x-border, rect.y-border,
				rect.width+2*border, rect.height+2*border);
		super(lid, borderedRect, "", border);
		this.removeChild(this.message);
		this.img = new SLLImageLayer("img", img, rect);
		this.img.moveTo(border,border);
		this.addChild(this.img);
		this.addChild(this.message);
		this.state_clips = [rect, null, null, null];
	}
	
	drawSelf(ctx, bounds, drawOutsideBounds = false) {
//		if (this.id > 400)
//			console.log(`button ${this.id} state ${this.state}`);
		if (this.state_clips[this.state] != null)
			this.img.setClip(this.state_clips[this.state]);
		if (this.border > 0)
			return super.drawSelf(ctx, bounds, drawOutsideBounds);
		return bounds;
	}
	
	setClips(upClip, overClip=null, downClip=null, disabledClip=null) {
		this.state_clips[SLL_BUTTON_STATES.UP] = upClip;
		this.state_clips[SLL_BUTTON_STATES.DOWN] = downClip;
		this.state_clips[SLL_BUTTON_STATES.OVER] = overClip;
		this.state_clips[SLL_BUTTON_STATES.DISABLED] = disabledClip;
	}

}
