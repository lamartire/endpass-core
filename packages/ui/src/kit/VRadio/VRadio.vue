<template>
  <label :class="vRadioCssClass">
    <input
      v-bind="$attrs"
      :checked="value === modelValue"
      type="radio"
      class="v-radio-input"
      @input="onInputChange"
    >
    <span class="v-radio-box" />
    <span
      v-if="$slots.default"
      class="v-radio-label"
    >
      <slot />
    </span>
    <div v-if="tooltipLabel">
      <tooltip-molecule :label="tooltipLabel" />
    </div>
  </label>
</template>

<script>
import TooltipMolecule from '@/molecule/tooltip-molecule/tooltip-molecule';
import ThemeMixin from '@/mixins/ThemeMixin';

export default {
  name: 'VRadio',

  props: {
    value: {
      type: String,
      required: true,
    },

    modelValue: {
      type: String,
      default: null,
    },

    tooltipLabel: {
      type: String,
      default: null,
    },

    isError: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    vRadioCssClass() {
      return {
        ...this.themeCssClass,
        'v-radio': true,
        'is-error': this.isError,
        'is-disabled': this.$attrs.disabled,
      };
    },
  },

  methods: {
    onInputChange() {
      this.$emit('change', this.value);
    },
  },

  mixins: [ThemeMixin],

  components: {
    TooltipMolecule,
  },

  model: {
    prop: 'modelValue',
    event: 'change',
  },
};
</script>
