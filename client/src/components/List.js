import React, { Component } from 'react';
import { fetchData } from '../store/action/actions.js';

export class List extends Component {
  constructor() {
    super();
    this.state = {
      values: []
    };
  }

  getData = () => {
    alert('glkfkijgik');
    this.props.dispatch(fetchData());
  };

  renderData = () => {
    return (
      <ul>
        {this.props.values.map((value, index) => {
          return <li key={index}>{value}</li>;
        })}
      </ul>
    );
  };

  render() {
    return (
      <div>
        <button onClick={this.getData}>FETCH DATA!</button>

        {this.renderData()}
      </div>
    );
  }
}
