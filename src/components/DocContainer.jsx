import React from 'react';
import { connect } from 'react-redux';
import { matchPath, withRouter } from 'react-router-dom';
import { compose } from 'redux';
import Transition from 'react-transition-group/Transition';
import cx from 'classnames';
import qs from 'qs';
import { ThemeProvider } from '@databyss-org/ui';
import Doc from './Doc.jsx';
import DocHead from './DocHead.jsx';
import DocHeadMotif from './DocHeadMotif.jsx';

import Disambiguate from './Disambiguate.jsx';
import appActions from '../redux/app/actions';
import searchActions from '../redux/search/actions';
import withLoader from '../hoc/withLoader';
import freezeProps from '../hoc/freezeProps';
import { parseTerm } from '../lib/url';
import styles from '../app.scss';
//import MotifLanding from './Landing/MotifLanding.jsx';
import MotifLanding from './MotifLanding.jsx';

import theme from '../theme';

const { DEFAULT_AUTHOR } = process.env;

const getAsideTerm = location => {
  const asidePath = '/(motif|source|search)/(.*)/motif::term';
  const match = matchPath(location.pathname, asidePath);
  if (match) {
    return match.params.term;
  }
  return null;
};

let mainElement = null;

const getQuery = ({ location, match, app }) => {
  let { term } = match.params;
  const { groupBy, filterBy } = match.params;
  let author = DEFAULT_AUTHOR;
  let resource = term;

  // handle author selector in the term
  //  ex: /motif/absolute:KA
  if (location.search) {
    location.query = qs.parse(location.search.replace('?', ''));
  }

  const asideTerm = getAsideTerm(location);
  let aside;
  if (asideTerm) {
    aside = parseTerm(asideTerm);
  }

  // parse author or set default
  switch (match.params[0]) {
    case 'search':
    case 'motif': {
      if (filterBy && filterBy !== 'about') {
        ({ author } = app.biblio[filterBy]);
        term = `${resource}:${author}:${filterBy}`;
      } else {
        ({ author, resource, term } = parseTerm(term));
        if (groupBy) {
          term = `${term}:sources`;
        }
      }
      break;
    }
    case 'source': {
      if (term.match(/\./)) {
        [author, resource] = term.split('.');
      }
      break;
    }
  }

  return {
    term,
    author,
    resource,
    authoredResource: `${resource}:${author}`,
    type: match.params[0],
    search: match.params[0] === 'search',
    motif: match.params[0] === 'motif',
    source: match.params[0] === 'source',
    aside,
    isLinked: app.motifLinksAreActive,
    groupBy,
    filterBy,
  };
};

const onClick = ({ history, e, showDisambiguate }) => {
  let { target } = e;
  if (target.tagName.toLowerCase() === 'em') {
    target = target.parentNode;
  }
  if (
    target.tagName.toLowerCase() === 'a' &&
    target.pathname.match(/disambiguate\//)
  ) {
    e.preventDefault();
    const position = {
      top:
        target.getBoundingClientRect().top -
        mainElement.getBoundingClientRect().top +
        mainElement.scrollTop +
        15,
    };
    showDisambiguate({
      midList: target.search.match(/mids=(.+)&?/)[1].split(','),
      position,
      target,
      className: styles.disambiguateLink,
    });
    return;
  }
  if (
    target.tagName.toLowerCase() === 'a' &&
    target.pathname.match(/motif\//)
  ) {
    // redirect motif link clicks
    e.preventDefault();
    history.push(target.pathname);
  }
};

const DocContainer = ({
  search,
  match,
  query,
  history,
  showDisambiguate,
  motif,
  app,
}) => (
  // console.log('MATCH', match);
  <ThemeProvider theme={theme}>
    <Transition in={Boolean(query.aside)} timeout={300}>
      {state => (
        <div
          onClick={e => onClick({ e, history, showDisambiguate })}
          className={cx(styles.docContainer, {
            [styles.withAside]: query.aside,
            /* TEMPORARY FOR MOTIF TESTINGS
            [styles.landing]: query.motif,
           */
          })}
        >
          {!query.motif ? (
            <DocHead transitionState={state} query={query} />
          ) : (
            <DocHeadMotif
              transitionState={state}
              motif={motif}
              cfList={
                motif.cfauthors
                  ? motif.cfauthors
                      .filter(id => id !== DEFAULT_AUTHOR)
                      .concat(DEFAULT_AUTHOR)
                      .reduce(
                        (list, id) =>
                          query.author === id
                            ? list
                            : list.concat(app.authorDict[id]),
                        []
                      )
                  : null
              }
              meta={
                query.filterBy
                  ? app.config.source_motif_meta
                  : app.config.motif_meta
              }
              author={app.authorDict[query.author]}
              query={query}
              source={query.filterBy && app.biblio[query.filterBy]}
              showAll={!query.groupBy}
              app={app}
            />
          )}

          <div
            className={cx(styles.doc, styles[state], {
              [styles.show]: true,
              [styles.landing]: query.motif,
            })}
          >
            <main
              ref={elem => {
                mainElement = elem;
              }}
            >
              {query.motif ? (
                <MotifLanding
                  motif={motif}
                  cfList={
                    motif.cfauthors
                      ? motif.cfauthors
                          .filter(id => id !== DEFAULT_AUTHOR)
                          .concat(DEFAULT_AUTHOR)
                          .reduce(
                            (list, id) =>
                              query.author === id
                                ? list
                                : list.concat(app.authorDict[id]),
                            []
                          )
                      : null
                  }
                  meta={
                    query.filterBy
                      ? app.config.source_motif_meta
                      : app.config.motif_meta
                  }
                  author={app.authorDict[query.author]}
                  query={query}
                  source={query.filterBy && app.biblio[query.filterBy]}
                  showAll={!query.groupBy}
                />
              ) : (
                <Doc
                  query={query}
                  path={['main']}
                  ready={state === 'entered'}
                />
              )}
              <Disambiguate />
            </main>
            {query.aside && (
              <aside>
                <Doc
                  query={{
                    ...query,
                    motif: true,
                    ...query.aside,
                  }}
                  path={['aside']}
                  ready={state === 'entered'}
                />
              </aside>
            )}
          </div>
        </div>
      )}
    </Transition>
  </ThemeProvider>
);

export default compose(
  connect(
    state => state,
    { ...appActions, ...searchActions }
  ),
  withRouter,
  withLoader({
    propsToLoad: props => {
      const query = getQuery(props);
      return {
        query,
        ...(query.motif
          ? {
              motif: props.app.doc[query.term],
            }
          : {}),
        ...(query.aside
          ? {
              aside: props.app.doc[query.aside.term],
            }
          : {}),
        ...(query.source
          ? {
              source: props.app.entriesBySource[query.term],
            }
          : {}),
        ...(query.search
          ? {
              results: props.search.results[query.term],
            }
          : {}),
      };
    },
    loaderActions: props => {
      const query = getQuery(props);
      return {
        ...(query.motif
          ? {
              motif: () =>
                props.fetchMotif({
                  mid: query.resource,
                  author: query.author,
                  sid: query.filterBy,
                  showAll: !query.groupBy,
                }),
            }
          : {}),
        ...(query.aside
          ? {
              aside: () =>
                props.fetchMotif({
                  mid: query.aside.resource,
                  author: DEFAULT_AUTHOR,
                }),
            }
          : {}),
        ...(query.source
          ? {
              source: () => props.fetchSource({ sid: query.term }),
            }
          : {}),
        ...(query.search
          ? {
              results: () =>
                props.searchEntries({
                  query: query.resource,
                  author: query.author,
                }),
            }
          : {}),
      };
    },
  }),
  freezeProps({
    propsToFreeze: props => ({
      query: !props.isLoading,
    }),
  })
)(DocContainer);
