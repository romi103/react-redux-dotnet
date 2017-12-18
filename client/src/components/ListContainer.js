import { List } from './List.js';
import React, { Component } from 'react';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// const mapDispatchToProps = (dispatch) => {

//     const boundActionCreators = bindActionCreators({

//     }, dispatch);
//     const allActionProps = { ...boundActionCreators, dispatch }
//     return allActionProps;

// }

const mapStateToProps = state => {
  return {
    values: state.values
  };
};

export const ListContainer = connect(
  mapStateToProps
  // mapDispatchToProps
)(List);
