export const valuesReducer = (state = ['valueTest1', 'valueTest2'], action) => {
  switch (action.type) {
    case 'ADD_DATA':
      return [...state, ...action.values];
    default:
      return state;
  }
};
