import React, { PureComponent } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import shallowequal from 'shallowequal';

import appActions from '../redux/app/actions';
import searchActions from '../redux/search/actions';

import EntriesByMotif from './EntriesByMotif.jsx';
import EntriesBySource from './EntriesBySource.jsx';
import SourcesByMotif from './SourcesByMotif.jsx';

const { DEFAULT_AUTHOR } = process.env;

class Doc extends PureComponent {
  constructor(props) {
    super(props);
    this.query = props.query;
    this._updateRows(this.props);
    this.lastScroll = {
      query: null,
      hash: null,
    };
    this.setScroll = this.setScroll.bind(this);
  }

  componentWillMount() {
    document.addEventListener('keypress', this.onKeyPress.bind(this));
  }

  componentWillUnount() {
    document.removeEventListener('keypress', this.onKeyPress.bind(this));
  }

  componentWillReceiveProps(nextProps) {
    const queryChanged = !shallowequal(this.query, nextProps.query);
    const resultsChanged =
      this.props.searchState.results !== nextProps.searchState.results;

    if (queryChanged) {
      this.query = nextProps.query;
      this.setState({ lastScroll: { query: null, path: null } });
    }

    if (queryChanged || resultsChanged) {
      this._updateRows(nextProps);
    }
  }

  onKeyPress(e) {
    if (e.key === '/' && e.getModifierState('Control')) {
      this.props.toggleIdLinks(!this.props.appState.idLinksAreActive);
    }
  }

  setScroll(hash) {
    if (!this.props.ready) {
      return false;
    }
    const scroll = { query: this.query, hash };
    if (shallowequal(this.lastScroll, scroll)) {
      return false;
    }
    this.lastScroll = scroll;
    return true;
  }

  _updateRows(props) {
    const { entriesBySource, doc } = props.appState;
    const { results } = props.searchState;
    const {
      search,
      motif,
      source,
      term,
      isLinked,
      resource,
      filterBy,
    } = this.query;
    const { path } = this.props;
    console.log(motif);
    console.log(filterBy);
    if (motif && filterBy) {
      this._rows = [term];
      this._rowComponent = ({ index, key, style }) => (
        <EntriesByMotif
          doc={doc}
          isLinked={isLinked}
          mid={term}
          key={key}
          style={style}
          path={path}
          setScroll={this.setScroll}
        />
      );
    } else if (motif) {
      this._rows = [term];
      this._rowComponent = () => <SourcesByMotif doc={doc} term={term} />;
    } else if (source) {
      this._rows = [term];
      this._rowComponent = ({ index, key, style }) => (
        <EntriesBySource
          isLinked={isLinked}
          sid={term}
          entries={entriesBySource[term]}
          key={key}
          style={style}
          path={path}
          showHeader
          setScroll={this.setScroll}
          showMotifNav={this.query.author === DEFAULT_AUTHOR}
        />
      );
    } else if (search) {
      this._rows = Object.keys(results[term]);
      this._rowComponent = ({ index, key, style }) => (
        <EntriesBySource
          sid={this._rows[index]}
          isLinked={isLinked}
          entries={results[term][this._rows[index]]}
          key={key}
          style={style}
          showHeader
          highlight={resource.split(/\s/)}
          path={path}
          setScroll={this.setScroll}
          showMotifNav={this.query.author === DEFAULT_AUTHOR}
        />
      );
    }
  }

  render() {
    return this._rows.map((key, index) =>
      this._rowComponent({ index, key, style: {} })
    );
  }
}

export default withRouter(
  connect(
    state => ({
      appState: state.app,
      searchState: state.search,
    }),
    { ...appActions, ...searchActions }
  )(Doc)
);
