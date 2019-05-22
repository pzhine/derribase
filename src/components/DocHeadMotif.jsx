import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  Raw,
  PageHeading,
  PageSubHeading,
  Link,
  Content,
  PageNav,
  CommaSeparatedList,
  SwitchControl,
} from '@databyss-org/ui';

import cx from 'classnames';
import renderTemplate from 'react-text-templates';
import actions from '../redux/app/actions';
import styles from '../app.scss';
import pluralize from 'pluralize';

class DocHeadMotif extends PureComponent {
  constructor(props) {
    super(props);
    this.updateTemplates = this.updateTemplates.bind(this);
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
      source,
      showAll,
    } = this.props;

    return (
      <div className={cx(styles.docHead, styles[transitionState])}>
        <Content>
          {(source || showAll) && (
            <div className={styles.toggle}>
              <SwitchControl
                label='Motif Links'
                checked={app.motifLinksAreActive}
                onChange={() => toggleMotifLinks(!app.motifLinksAreActive)}
              />
            </div>
          )}
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
      </div>
    );
  }
}

export default connect(
  state => state,
  actions
)(DocHeadMotif);
