Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    options: {
      type: Array,
      value: []
    },
    defaultValue: {
      type: null,
      value: null
    }
  },

  data: {
    selectedValue: null,
    modalAnimationClass: ''
  },

  observers: {
    'visible': function(newVal) {
      if (newVal) {
        this.setData({ 
          selectedValue: this.data.defaultValue
        });
      }
    }
  },

  methods: {
    closePopup() {
      this.triggerEvent('close');
    },

    preventPropagation() {
      // 阻止事件冒泡
    },

    onSelect(e) {
      const { value } = e.currentTarget.dataset;
      this.setData({ selectedValue: value });
    },

    onConfirm() {
      this.triggerEvent('confirm', { value: this.data.selectedValue });
      this.closePopup();
    }
  }
});