import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  Raw,
  PageHeading,
  PageSubHeading,
  Link,
  Content,
  ContentNav,
  PageNav,
  CommaSeparatedList,
  SwitchControl,
} from '@databyss-org/ui';

import cx from 'classnames';
import renderTemplate from 'react-text-templates';

import ColumnHeadMotif from './ColumnHeadMotif';
import Toggle from './Toggle';
import actions from '../redux/app/actions';
import styles from '../app.scss';
import pluralize from 'pluralize';
import { textify } from '../lib/_helpers';

class DocHeadMotif extends PureComponent {
  constructor(props) {
    super(props);
    this.updateTemplates = this.updateTemplates.bind(this);
  }

  updateTemplates() {
    const { motif, cfList, meta, author, query, source, showAll } = this.props;
    this.templateTokens = {
      AUTHOR_NAME: `${author.firstName} ${author.lastName}`,
      MOTIF_NAME: <Raw html={motif.name} />,
      ENTRY_COUNT: motif.entryCount
        ? `${motif.entryCount} ${pluralize('entry', motif.entryCount)}`
        : '',
      SOURCE_COUNT: motif.sources
        ? `${motif.sources.length} ${pluralize('source', motif.sources.length)}`
        : '',
      SOURCE_TITLE: <Raw html={source && source.name} />,
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

  render() {
    this.updateTemplates();

    const {
      transitionState,
      query,
      app,
      search,
      toggleMotifLinks,
    } = this.props;

    console.log(this.landingProps);
    console.log(styles);
    return (
      <div className={cx(styles.docHead, styles[transitionState])}>
        <ContentNav
          right={
            <SwitchControl
              label='Motif Links'
              checked={app.motifLinksAreActive}
              onChange={() => toggleMotifLinks(!app.motifLinksAreActive)}
            />
          }
        >
          <Content>
            <PageHeading>
              <Raw html={this.landingProps.title} />
            </PageHeading>
            {this.landingProps.subtitle && (
              <PageSubHeading>
                <Raw html={this.landingProps.subtitle} />
              </PageSubHeading>
            )}
            {this.landingProps.cfList && (
              <PageNav ariaLabel='compare with'>
                <CommaSeparatedList opener={'[cf.\u00A0'} closer={']'}>
                  {this.landingProps.cfList.map(cf =>
                    React.cloneElement(this.landingProps.renderCfItem(cf), {
                      key: cf.id,
                    })
                  )}
                </CommaSeparatedList>
              </PageNav>
            )}
          </Content>
        </ContentNav>

        {/*
        <ColumnHeadMotif
          query={query}
          doc={app.doc}
          results={search.results[query.term]}
          resultsMeta={search.resultsMeta[query.term]}
          biblio={app.biblio}
          entriesBySource={app.entriesBySource}
          styles={styles}
          authorDict={app.authorDict}
        />
        {query.aside && (
          <ColumnHeadMotif
            query={{
              motif: true,
              type: 'motif',
              ...query.aside,
            }}
            doc={app.doc}
            styles={styles}
            authorDict={app.authorDict}
          />
        )}
          */}
      </div>
    );
  }
}

export default connect(
  state => state,
  actions
)(DocHeadMotif);

/*
const DocHeadMotif = ({
  transitionState,
  query,
  app,
  search,
  toggleMotifLinks,
}) => (
  <div className={cx(styles.docHead, styles[transitionState])}>
    <Toggle
      isActive={app.motifLinksAreActive}
      onClick={() => toggleMotifLinks(!app.motifLinksAreActive)}
    >
      Motif Links
    </Toggle>
    <ColumnHeadMotif
      query={query}
      doc={app.doc}
      results={search.results[query.term]}
      resultsMeta={search.resultsMeta[query.term]}
      biblio={app.biblio}
      entriesBySource={app.entriesBySource}
      styles={styles}
      authorDict={app.authorDict}
    />
    {query.aside && (
      <ColumnHeadMotif
        query={{
          motif: true,
          type: 'motif',
          ...query.aside,
        }}
        doc={app.doc}
        styles={styles}
        authorDict={app.authorDict}
      />
    )}
  </div>
);


export default connect(
  state => state,
  actions
)(DocHeadMotif);
*/

//THIS IS What you want it to look like
/*
=---------------------------------------------------------
<PageHeading>
  <Raw html={title} />
</PageHeading>;
{
  subtitle && (
    <PageSubHeading>
      <Raw html={subtitle} />
    </PageSubHeading>
  );
}
{
  cfList && (
    <PageNav ariaLabel='compare with'>
      [cf.{'\u00A0'}
      <CommaSeparatedList>
        {cfList.map(cf => React.cloneElement(renderCfItem(cf), { key: cf.id }))}
      </CommaSeparatedList>
      ]
    </PageNav>
  );
}
<ContentHeading>
  <Raw html={contentTitle} />
</ContentHeading>;
*/
