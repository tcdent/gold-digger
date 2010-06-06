
/**
 * Gold Digger Color Picker
 * (c) 2010 Travis Dent <tcdent@gmail.com>
 */

var GoldDigger = {
    instance: false, 
    elements: [], 
    
    attach: function(elements, options){
        if(!this.instance)
            this.instance = new GoldDigger.Base(options);
        
        this.elements = $(elements);
        if(!this.elements) this.elements = $$(elements);
        if(!this.elements.length) this.elements = [this.elements];
        
        this.elements.each(function(element){
            $(element).observe('focus', function(event){
                this.instance.attach(event.element());
            }.bind(this));
        }.bind(this));
    }, 
    
    normalize: function(value, max){
        if(max) value = Math.min(max, value);
        return Math.max(value, 0);
    }, 
    
    reverse: function(value, max){
        return (GoldDigger.normalize(value, max) - max).abs();
    }
};


GoldDigger.Base = Class.create({
    initialize: function(options){
        this.element = null;
        this.options = Object.extend({
            auto_update: true, 
            offset_top: 0, 
            offset_left: 10
        }, options || {});
        
        var saturation = new Element('div', {'class':'saturation'});
        this.saturation_selector = new GoldDigger.SaturationSelector(
            saturation, this.update_saturation.bind(this));
        
        var hue = new Element('div', {'class':'hue'})
            .setStyle({ height:'100px'});
        this.hue_selector = new GoldDigger.HueSelector(
            hue, this.update_hue.bind(this));
        
        this.preview = new Element('div', {'class':'preview'});
        
        this.hex_field = new Element('input', { type:'text'});
        new Form.Element.Observer(this.hex_field, .5, function(event){
            if(this.hex_field.value.length == 7)
                this.update_hex(this.hex_field.value);
        }.bind(this));
        
        this.button = new Element('a', {'class':'button'})
            .update("OK")
            .observe('click', function(){
                this.element.value = this.color.to_hex();
                this.release();
            }.bind(this));
        
        this.picker = new Element('div', {'class':'gold_digger'})
            .insert(saturation)
            .insert(hue)
            .insert(this.preview)
            .insert(this.hex_field)
            .insert(this.button)
            .hide();
        
        this.hide_listener = this._hide_listener.bindAsEventListener(this);
        $$('body').first().insert({ bottom: this.picker });
    }, 
    
    attach: function(element){
        if(this.element) this.release();
        this.element = $(element);
        
        var offset = this.element.cumulativeOffset(), 
            width = this.element.getWidth();
        this.picker.setStyle({
            top: (offset.top + this.options.offset_top) + 'px', 
            left: (offset.left + this.options.offset_left + width) + 'px'
        });
        
        this.element.observe('blur', this.hide_listener);
        this.picker.observe('mousedown', this.hide_listener);
        
        // Allow interaction with hex field.
        this.hex_field.observe('mousedown', function(){
            this.element.stopObserving('blur');
        }.bind(this));
        this.hex_field.observe('blur', function(){
            this.element.observe('blur', this.hide_listener);
            this.element.focus();
        }.bind(this));
        
        this.picker.show();
        this.update_hex(this.element.value);
    }, 
    
    release: function(){
        this.element.stopObserving('blur', this.hide_listener);
        this.picker.stopObserving('mousedown', this.hide_listener);
        this.hex_field.stopObserving('mousedown');
        this.hex_field.stopObserving('blur');
        
        if(this.options.auto_update)
            this.element.value = this.color.to_hex();
        
        this.picker.hide();
        this.element = null;
    }, 
    
    update_hue: function(hue){
        this.color.hue = hue;
        this.update();
    }, 
    
    update_saturation: function(saturation, value){
        this.color.saturation = saturation;
        this.color.value = value;
        this.update();
    }, 
    
    update_hex: function(color){
        this.color = new GoldDigger.Color.HEX(color);
        this.update();
    }, 
    
    update: function(){
        this.hex_field.value = this.color.to_hex();
        this.preview.setStyle({ backgroundColor: this.color.to_hex() });
        this.hue_selector.set_color(this.color);
        this.saturation_selector.set_color(this.color);
    }, 
    
    _hide_listener: function(event){
        // Release when field is tabbed away from.
        if(!event.isLeftClick())
            return this.release();
        
        var offset = this.picker.viewportOffset(), 
            width = this.picker.getWidth(), 
            height = this.picker.getHeight(), 
            x_range = $R(offset.left, offset.left + width), 
            y_range = $R(offset.top, offset.top + height), 
            x_position = event.pointerX().round(), 
            y_position = event.pointerY().round();
        
        // Release if click was outside picker.
        if(!x_range.include(x_position) || !y_range.include(y_position))
            this.release();
        
        // Allow interaction with hex field.
        if(event.element() != this.hex_field)
            event.stop();
    }
});


GoldDigger.HueSelector = Class.create({
    initialize: function(element, callback){
        this.element = $(element);
        this.callback = callback;
        this.hue = 0;
        
        this.handle = new Element('div', {'class':'handle'});
        this.element.update(this.handle);
        
        this.control = new Control.Slider(this.handle, this.element, {
            axis:'vertical', 
            range: $R(0, 360),
            onSlide: function(position){
                this.update(GoldDigger.reverse(position, 360));
            }.bind(this)
        });
    }, 
    
    // Set the color. Expects a GoldDigger.Color object.
    set_color: function(color){
        this.set_hue(color.hue)
        this.set_position(color.hue);
    }, 
    
    // Set the hue. Values in a range of [0, 360].
    set_hue: function(hue){
        this.hue = GoldDigger.normalize(hue, 360).round();
    }, 
    
    // Set the handle position. Values in a range of [0, 360].
    set_position: function(hue){
        this.control.setValue(GoldDigger.reverse(hue, 360));
    }, 
    
    // Update hue and pass on to callback. Values in a range of [0, 360].
    update: function(hue){
        this.set_hue(hue);
        
        if(this.callback)
            this.callback(this.hue);
    }
});


GoldDigger.SaturationSelector = Class.create({
    initialize: function(element, callback){
        this.element = $(element);
        this.callback = callback;
        this.saturation = 0;
        this.value = 0;
        
        this.handle = new Element('div', {'class':'handle'});
        this.element
            .update(this.handle)
            .observe('mousedown', function(event){
                var offset = this.element.cumulativeOffset(), 
                    saturation = (event.pointerX() - offset[0]) - 1, 
                    value = GoldDigger.reverse(event.pointerY() - offset[1], this.get_height());
                
                this.set_position(saturation, value);
                this.control.initDrag(event);
                this.control.updateDrag(event, event.pointer());
            }.bind(this));
        
        this.control = new Draggable(this.handle, {
            snap: function(x, y){
                return [
                    GoldDigger.normalize(x, this.get_width()), 
                    GoldDigger.normalize(y, this.get_height())
                ];
            }.bind(this), 
            onDrag: function(element, event){
                var position = element.currentDelta(), 
                    value = GoldDigger.reverse(position[1], this.get_height());
                this.update(position[0], value);
            }.bind(this)
        });
    }, 
    
    get_width: function(){
        if(!this.width) this.width = this.element.getWidth();
        return this.width;
    }, 
    
    get_height: function(){
        if(!this.height) this.height = this.element.getHeight();
        return this.height;
    }, 
    
    // Set the color. Expects a GoldDigger.Color object.
    set_color: function(color){
        var saturation = color.saturation * this.get_width(), 
            value = color.value * this.get_height();
        
        this.set_saturation(color.saturation);
        this.set_value(color.value);
        this.set_position(saturation, value);
        this.element.setStyle({ backgroundColor: color.purify().to_hex() });
    }, 
    
    // Set the saturation. Values in a range of [0, 1].
    set_saturation: function(saturation){
        this.saturation = GoldDigger.normalize(saturation, 1);
    }, 
    
    // Set the color value. Values in a range of [0, 1].
    set_value: function(value){
        this.value = GoldDigger.normalize(value, 1);
    }, 
    
    // Set the handle's position. Values in a range of [0, selector-size].
    set_position: function(saturation, value){
        var left = GoldDigger.normalize(saturation, this.get_width()), 
            top = GoldDigger.reverse(value, this.get_height());
        
        this.handle.setStyle({ left: left + 'px', top: top + 'px'});
    }, 
    
    // Update saturation and color value and pass on to callback. 
    // Values in a range of [0, selector-size].
    update: function(saturation, value){
        this.set_saturation(saturation / this.get_width());
        this.set_value(value / this.get_height());
        
        if(this.callback)
            this.callback(this.saturation, this.value);
    }
});


GoldDigger.Color = {};

GoldDigger.Color.HSV = Class.create({
    initialize: function(hsv){
        this.hue = hsv[0];
        this.saturation = hsv[1];
        this.value = hsv[2];
    }, 
    
    to_hsv: function(){
        return [this.hue, this.saturation, this.value];
    }, 
    
    to_rgb: function(){
        var h = this.hue, 
            s = this.saturation, 
            v = this.value;
        
        var f = (h / 60) - (h / 60).floor(), 
            p = ((v * (1 - s)) * 255).round(), 
            q = ((v * (1 - f * s) * 255)).round(), 
            t = ((v * (1 - (1 - f) * s) * 255)).round(), 
            v = (v * 255).round();
        
        switch((h / 60).floor() % 6){
            case 0: return [v, t, p];
            case 1: return [q, v, p];
            case 2: return [p, v, t];
            case 3: return [p, q, v];
            case 4: return [t, p, v];
            case 5: return [v, p, q];
            default: return [0, 0, 0];
        }
    },
    
    to_hex: function(){
        return "#" + this.to_rgb().map(function(i){
            return i.toColorPart();
        }).join('');
    }, 
    
    purify: function(){
        var clone = Object.clone(this);
        clone.saturation = 1;
        clone.value = 1;
        return clone;
    }
});


GoldDigger.Color.RGB = Class.create(GoldDigger.Color.HSV, {
    initialize: function($super, rgb){
        var r = rgb[0] / 255, 
            g = rgb[1] / 255, 
            b = rgb[2] / 255, 
            max = rgb.max() / 255, 
            min = rgb.min() / 255;
        
        var h = (function(){
            switch(max){
                case min: return 0;
                case r: return (60 * (g - b) / (max - min) + 360) % 360;
                case g: return  60 * (b - r) / (max - min) + 120;
                case b: return  60 * (r - g) / (max - min) + 240;
                default: return 0;
            }
        })();
        var s = (max == 0)? 0 : (max - min) / max;
        var v = max;
        
        $super([h, s, v]);
    }
});


GoldDigger.Color.HEX = Class.create(GoldDigger.Color.RGB, {
    initialize: function($super, hex){
        $super(hex.replace(/^#/, '').split('').eachSlice(2, function(slice){
            return parseInt(slice.join(''), 16);
        }));
    }
});

