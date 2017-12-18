import ApiConfig from '../../api/apiConfig.js';

export const getValues = async () => {
  var response = await fetch(`${ApiConfig.host}/api/values`);
  return await response.json();
};

export const fetchData = data => {
  return (dispatch, getState) => {
    getValues().then(data => {
      dispatch(addValues(data));
    });
  };
};

export const addValues = arrValues => {
  return {
    type: 'ADD_DATA',
    values: arrValues
  };
};
