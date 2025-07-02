Component({
  properties: {
    dict: {
      type: Object,
      value: {}
    }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.properties.dict.id });
    }
  }
}); 