"use strict";

parserFactory.register("ranobes.com", () => new RanobesComParser());

class RanobesComParser extends Parser{
    constructor() {
        super();
    }

    async getChapterUrls(dom, chapterUrlsUI) {
        let chapters = [...dom.querySelectorAll("ul.chapters-scroll-list a")]
            .map(a => ({
                sourceUrl:  a.href,
                title: a.querySelector(".title").textContent
            }));
        let tocUrl = dom.querySelector("div.r-fullstory-chapters-foot a[title='Перейти в оглавление']")?.href;
        if (tocUrl == null) {
            return chapters.reverse();
        }
        let tocDom = (await HttpClient.wrapFetch(tocUrl)).responseXML;
        let urlsOfTocPages = RanobesComParser.extractTocPageUrls(tocDom, tocUrl);
        return (await this.getChaptersFromAllTocPages(chapters, 
            this.extractPartialChapterList, urlsOfTocPages, chapterUrlsUI)).reverse();
    }

    static extractTocPageUrls(dom, baseUrl) {
        let max = RanobesComParser.extractTocJson(dom)?.pages_count ?? 0;
        let tocUrls = [];
        for(let i = 2; i <= max; ++i) {
            tocUrls.push(`${baseUrl}page/${i}/`);
        }
        return tocUrls;
    }

    static extractTocJson(dom) {
        const chapters =
            Array.from(dom.querySelectorAll('.cat_block > a')).map(x => ({ sourceUrl: x.href, title: x.title }));
        const pageElement = dom.querySelector('.pages > a:last-child') || dom.querySelector('.pages > span:last-child');
        const pages = pageElement ? +pageElement.innerText : 0;

        return {chapters: chapters, pages_count: pages};
    }

    extractPartialChapterList(dom) {
        return RanobesComParser.extractTocJson(dom).chapters.map(c => ({
            sourceUrl: c.sourceUrl,
            title: c.title
        }));
    }

    findContent(dom) {
        return dom.querySelector("div#arrticle");
    }

    extractTitleImpl(dom) {
        let title = dom.querySelector("h1.title");
        util.removeChildElementsMatchingCss(title, "span.subtitle, span[hidden]");
        return title;
    }

    findChapterTitle(dom) {
        let title = dom.querySelector("h1.title");
        util.removeChildElementsMatchingCss(title, "span, div");
        return title.textContent;
    }

    findCoverImageUrl(dom) {
        return util.getFirstImgSrc(dom, "div.r-fullstory-poster");
    }

    getInformationEpubItemChildNodes(dom) {
        return [...dom.querySelectorAll("div.moreless__full")];
    }

    cleanInformationNode(node) {
        util.removeChildElementsMatchingCss(node, "a");
        return node;
    }    
}
