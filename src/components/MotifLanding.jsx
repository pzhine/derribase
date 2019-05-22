import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { compose } from 'redux';
import pluralize from 'pluralize';
import {
  ContentNav,
  TocList,
  Link,
  Raw,
  Entry,
  EntriesByLocation,
  EntriesBySource,
  Content,
  ContentHeading,
  BackButton,
  ForwardButton,
} from '@databyss-org/ui';
import renderTemplate from 'react-text-templates';
import { Helmet } from 'react-helmet';
import actions from '../redux/app/actions';
import { textify } from '../lib/_helpers';
import styles from '../app.scss';

let thisStyle = {
  marginTop: '0px',
};

class MotifLandingCopy extends React.Component {
  constructor(props) {
    super(props);
    this.onSourceClick = this.onSourceClick.bind(this);
    this.renderEntries = this.renderEntries.bind(this);
    this.renderSourcesToc = this.renderSourcesToc.bind(this);
    this.updateTemplates = this.updateTemplates.bind(this);
    this.onMotifLinksChange = this.onMotifLinksChange.bind(this);
    this.onAllEntriesClick = this.onAllEntriesClick.bind(this);
    this.onSourcesClick = this.onSourcesClick.bind(this);
  }

  updateTemplates() {
    const { motif, cfList, meta, author, query, source, showAll } = this.props;
    this.templateTokens = {
      AUTHOR_NAME: `${author.firstName} ${author.lastName}`,
      MOTIF_NAME: motif.name,
      ENTRY_COUNT: motif.entryCount
        ? `${motif.entryCount} ${pluralize('entry', motif.entryCount)}`
        : '',
      SOURCE_COUNT: motif.sources
        ? `${motif.sources.length} ${pluralize('source', motif.sources.length)}`
        : '',
      SOURCE_TITLE: source && source.name,
    };
    this.textOnlyTokens = {
      ...this.templateTokens,
      MOTIF_NAME: textify(motif.name),
      SOURCE_TITLE: source ? textify(source.name) : '',
    };
    this.contentTitle = renderTemplate(
      meta.LANDING_SUMMARY,
      this.templateTokens
    );
    this.landingProps = {
      cfList,
      title: renderTemplate(meta.LANDING_HEADING, this.templateTokens),
      subtitle:
        meta.LANDING_SUB_HEADING &&
        renderTemplate(meta.LANDING_SUB_HEADING, this.templateTokens),
      renderCfItem: cf => (
        <Link
          href={`/motif/${query.resource}:${cf.id}${showAll ? '' : '/sources'}`}
        >
          {cf.lastName}
        </Link>
      ),
      contentTitle: this.contentTitle,
    };
  }
  onSourceClick(href) {
    return () => this.props.history.push(href);
  }
  onEntrySourceOnClick(source) {
    return () => {
      this.props.toggleSourceModal(source.id);
      this.props.history.push(`#source:${source.id}`);
    };
  }
  onMotifLinksChange(checked) {
    this.props.toggleMotifLinks(checked);
  }
  onAllEntriesClick() {
    this.props.history.push(`/motif/${this.props.query.authoredResource}`);
  }
  onSourcesClick() {
    this.props.history.push(
      `/motif/${this.props.query.authoredResource}/sources`
    );
  }
  renderSourcesToc() {
    const { motif, query } = this.props;

    const renderSource = source => {
      const href = `/motif/${query.resource}/sources/${source.id}`;
      return (
        <Link href={href} onClick={this.onSourceClick(href)}>
          <Raw
            html={`${source.name}${
              source.entryCount ? ` (${source.entryCount})` : null
            }`}
          />
        </Link>
      );
    };
    return (
      <Content>
        <ContentHeading style={thisStyle}>
          <Raw html={this.contentTitle} />
        </ContentHeading>
        <ContentNav
          right={
            <ForwardButton
              label='All Entries'
              onClick={this.onAllEntriesClick}
            />
          }
        >
          {' '}
        </ContentNav>

        <TocList ariaLabel='sources' style={styles.sourcesToc}>
          {motif.sources.map(source =>
            React.cloneElement(renderSource(source), { key: source.id })
          )}
        </TocList>
      </Content>
    );
  }
  renderEntries(source) {
    const { motifLinksAreActive } = this.props.app;
    const renderEntry = entry => (
      <Entry
        sourceHref={`/source/${source ? source.id : entry.source.id}`}
        onSourceClick={this.onEntrySourceOnClick(source || entry.source)}
        {...entry}
        content={motifLinksAreActive ? entry.linkedContent : entry.content}
      />
    );

    return (
      <Content>
        <ContentHeading style={thisStyle}>
          <Raw html={this.contentTitle} />
        </ContentHeading>
        <ContentNav
          left={<BackButton label='Sources' onClick={this.onSourcesClick} />}
        >
          {source ? (
            <EntriesByLocation
              locations={this.props.motif.entriesByLocation}
              renderEntry={renderEntry}
              source={source}
            />
          ) : (
            <EntriesBySource
              sources={this.props.motif.sources}
              renderEntry={renderEntry}
            />
          )}
        </ContentNav>
      </Content>
    );
  }

  render() {
    const { source, showAll, meta, query } = this.props;
    const { META_TITLE, META_DESCRIPTION, META_KEYWORDS } = meta;
    this.updateTemplates();
    return (
      <Content {...this.landingProps}>
        <Helmet>
          <title>{renderTemplate(META_TITLE, this.textOnlyTokens)}</title>
          <meta
            name='description'
            content={renderTemplate(META_DESCRIPTION, this.textOnlyTokens)}
          />
          <meta
            name='keywords'
            content={renderTemplate(META_KEYWORDS, this.textOnlyTokens)}
          />
        </Helmet>
        {source || showAll
          ? this.renderEntries(source)
          : this.renderSourcesToc()}{' '}
      </Content>
    );
  }
}

export default compose(
  connect(
    state => state,
    actions
  ),
  withRouter
)(MotifLandingCopy);
