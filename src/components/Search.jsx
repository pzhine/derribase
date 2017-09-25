import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import qs from 'query-string';
import Autosuggest from 'react-autosuggest';
import Highlighter from 'react-highlight-words';
import latinize from 'latinize';
import actions from '../redux/search/actions';
import theme from '../scss/search.scss';
import { textify } from '../lib/_helpers';

import CloseIcon from '../icons/close.svg';
import LoadingImg from '../img/ajax-loader.gif';

class Search extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      searchWords: [],
      suggestions: [],
    };

    this.onChange = this.onChange.bind(this);
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.onSuggestionHighlighted = this.onSuggestionHighlighted.bind(this);
    this.onClearInput = this.onClearInput.bind(this);
    this.renderInputComponent = this.renderInputComponent.bind(this);
    this.renderSuggestion = this.renderSuggestion.bind(this);
    this.getSuggestions = this.getSuggestions.bind(this);
  }
  componentDidMount() {
    const { motif, source } = qs.parse(this.props.location.search);
    const { doc, sourceList } = this.props.appState;

    if (motif) {
      this.setState({
        value: textify(doc[motif].title)
      });
    }
    if (source) {
      this.setState({
        value: textify(sourceList.find(s => s.id === source).name)
      });
    }
  }
  setQuery(query) {
    this.props.setQuery(query);
  }
  getQuery() {
    return this.props.searchState.query;
  }
  getSuggestions(value) {
    const { motifList, sourceList } = this.props.appState;
    const wordSeparator = new RegExp(/[^a-z0-9'"]/);
    const searchWords = value.trim().toLowerCase().split(wordSeparator);

    if (!searchWords.length) {
      return [];
    }

    this.setState({ searchWords });

    const matchStems = (words, queries, matchCount = 0) => {
      let found = false;
      words.forEach((w, widx) => {
        queries.forEach((q, qidx) => {
          if (w.startsWith(q) && !found) {
            // remove term found from queries and words
            // then recurse on remaining terms/queries
            const nw = words.slice(0, widx).concat(words.slice(widx + 1));
            const nq = queries.slice(0, qidx).concat(queries.slice(qidx + 1));
            matchCount = matchStems(nw, nq, matchCount + 1);
            found = true;
          }
        });
      });
      return matchCount;
    };

    // filter collection
    const findMatches = collection => collection
      .filter(m => matchStems(
        latinize(m.name).toLowerCase().split(wordSeparator),
        searchWords
      // only pass when all query terms are matched
      ) === searchWords.length);

    // sort matches so that results starting with query are prioritized
    const sortMatches = collection => collection
      .sort((a, b) => {
        if (a.name.toLowerCase().startsWith(searchWords[0].toLowerCase())
        && !b.name.toLowerCase().startsWith(searchWords[0].toLowerCase())) {
          return -1;
        }
        if (b.name.toLowerCase().startsWith(searchWords[0].toLowerCase())
        && !a.name.toLowerCase().startsWith(searchWords[0].toLowerCase())) {
          return 1;
        }
        return 0;
      });

    const trimTo = max => c => c.slice(0, max);

    const compile = ({ collection, match, sort, filter, trim }) => {
      let res = collection;
      if (filter) {
        res = filter(res);
      }
      if (match) {
        res = match(res);
      }
      if (sort) {
        res = sort(res);
      }
      if (trim) {
        res = trim(res);
      }
      return res;
    };

    const compileDefaults = {
      match: findMatches,
      sort: sortMatches,
    };

    const motifMatches = compile({
      ...compileDefaults,
      collection: motifList,
      filter: c => c.map(m => ({
        ...m,
        name: m.name.replace(/\(.+?[a-z]+.+?\)/, '')
      })),
      trim: trimTo(5)
    });

    const sourceMatches = compile({
      ...compileDefaults,
      collection: sourceList,
      trim: trimTo(2)
    });

    return [
      ...(motifMatches.length ? [{
        title: 'Motifs',
        suggestions: motifMatches
      }] : []),
      ...(sourceMatches.length ? [{
        title: 'Sources',
        suggestions: sourceMatches
      }] : []),
      { suggestions: [{ type: 'entry' }] }
    ];
  }
  getSuggestionValue(suggestion) {
    return suggestion.id;
  }
  renderSuggestion(suggestion) {
    return {
      motif: (
        <div className={theme.motifSuggestion}>
          {suggestion.name}
        </div>
      ),
      source: (
        <div>{suggestion.display}</div>
      ),
      entry: (
        <div style={{ display: 'flex' }}>
          <div style={{ flexGrow: 1 }}>
            Find: {this.getQuery()}
          </div>
        </div>
      )
    }[suggestion.type];
  }
  onChange(event, { newValue }) {
    if (newValue === '') {
      this.onClearInput();
    }
    if (newValue) {
      this.setQuery(newValue);
      this.setState({
        value: newValue
      });
    }
  }
  onSuggestionSelected(event, { suggestion }) {
    const query = qs.parse(this.props.location.search);

    if (suggestion.type === 'entry') {
      this.props.searchEntries();
    }

    this.props.history.push({
      pathname: this.props.location.pathname,
      search: qs.stringify(Object.assign({}, query, {
        [suggestion.type]: suggestion.type === 'entry'
          ? this.getQuery()
          : suggestion.id
      }))
    });
    this.setState({
      value: suggestion.type === 'entry'
        ? this.getQuery()
        : textify(suggestion.name)
    });
  }
  onSuggestionHighlighted({ suggestion }) {
    if (!suggestion) { return; }

    this.setState({
      value: suggestion.type === 'entry'
        ? this.getQuery()
        : textify(suggestion.name)
    });
  }
  onSuggestionsFetchRequested({ value }) {
    this.setState({
      suggestions: this.getSuggestions(value)
    });
  }
  onSuggestionsClearRequested() {
    this.setState({
      suggestions: []
    });
  }
  onClearInput() {
    const query = qs.parse(this.props.location.search);
    delete query.motif;
    delete query.source;
    delete query.entry;
    this.props.history.push({
      pathname: this.props.location.pathname,
      search: qs.stringify(query)
    });
    this.setState({
      value: ''
    });
  }
  renderInputComponent(inputProps) {
    return (
      <div>
        <input className={theme.input} {...inputProps} />
        <button
          className={theme.clear}
          onClick={this.onClearInput}
          style={{ opacity: this.state.value ? 1 : 0 }}
        >
          <CloseIcon />
        </button>
      </div>
    );
  }
  renderSectionTitle(section) {
    return (
      <strong>{section.title}</strong>
    );
  }
  getSectionSuggestions(section) {
    return section.suggestions;
  }
  render() {
    const { suggestions, value } = this.state;

    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        onSuggestionSelected={this.onSuggestionSelected}
        onSuggestionHighlighted={this.onSuggestionHighlighted}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        renderInputComponent={this.renderInputComponent}
        renderSectionTitle={this.renderSectionTitle}
        getSectionSuggestions={this.getSectionSuggestions}
        multiSection={true}
        inputProps={{
          placeholder: 'Search for motif, source or phrase',
          value,
          onChange: this.onChange
        }}
        theme={theme}
      />
    );
  }
}

export default withRouter(connect(state => ({
  appState: state.app,
  searchState: state.search
}), actions)(Search));
