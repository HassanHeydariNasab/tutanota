"use strict";

goog.provide('tutao.locator');
goog.provide("tutao.tutanota.Bootstrap");

/**
 * Executes all initializations needed for the live one-and-only tutanota website.
 * This binding is located in gui, so that it is not used for unit or integration tests.
 */
tutao.tutanota.Bootstrap.init = function () {

    // disable all registered event handlers on the document and the window
    $(document).off();
    $(window).off();

    if (tutao.tutanota.util.ClientDetector.isSupported()) {
        $(window).unload(function () {
            tutao.locator.eventBus.close(); // close the socket in non legacy-mode
        });
    }

    if (tutao.locator && tutao.locator.eventBus) {
        tutao.locator.eventBus.close();
    }

    tutao.tutanota.Bootstrap.initControllers();
    Promise.longStackTraces();
    Promise.onPossiblyUnhandledRejection(function(e) {
        if (e instanceof tutao.ConnectionError) {
            tutao.tutanota.gui.alert(tutao.lang("serverNotReachable_msg"));
        } else if (e instanceof  tutao.InvalidSoftwareVersionError) {
            tutao.tutanota.gui.alert(tutao.lang("outdatedClient_msg"));
        } else {
            if (tutao.locator.viewManager.feedbackSupported()) {
                // only logged in users can report errors
                tutao.locator.feedbackViewModel.open(e.stack);
            } else {
                tutao.tutanota.gui.alert(tutao.lang("unknownError_msg"));
            }
        }
        console.log(e.stack);
    });

    if (!tutao.tutanota.app) {
        tutao.tutanota.app = ko.observable(true);
    } else {
        tutao.tutanota.app(!tutao.tutanota.app());
    }
    tutao.locator.viewManager.select(tutao.locator.fastMessageView);
    setTimeout(function () {
        tutao.locator.navigator.setup();
        tutao.locator.entropyCollector.start();

    }, 0);

    if (window.applicationCache) {
        var listener = new tutao.tutanota.ctrl.AppCacheListener();
    }

    // only for testing
	//	tutao.locator.loginViewModel.mailAddress("arne@tutanota.de");
	//	tutao.locator.loginViewModel.passphrase("arm");
	//	tutao.locator.loginViewModel.login();
    //setTimeout(function() {        tutao.locator.navigator.customer();}, 1000);

};

/**
 * @export
 */
tutao.tutanota.Bootstrap.initControllers = function () {
    tutao.crypto.ClientWorkerProxy.initWorkerFileNames('/js/', '/lib/');
    var singletons = {
        randomizer: tutao.crypto.SjclRandomizer,
        aesCrypter: tutao.crypto.AesWorkerProxy,
        rsaCrypter: tutao.crypto.RsaWorkerProxy,
        kdfCrypter: tutao.crypto.JBCryptAdapter,
        shaCrypter: tutao.crypto.SjclSha256,
        userController: tutao.ctrl.UserController,
        clientWorkerProxy: tutao.crypto.ClientWorkerProxy,
        dao: tutao.db.WebSqlDb,
        restClient: tutao.rest.RestClient,
        entityRestClient: tutao.rest.EntityRestClient,
        mailBoxController: tutao.tutanota.ctrl.MailBoxController,
        viewManager: tutao.tutanota.ctrl.ViewManager,
        loginViewModel: tutao.tutanota.ctrl.LoginViewModel,
        externalLoginViewModel: tutao.tutanota.ctrl.ExternalLoginViewModel,
        tagListViewModel: tutao.tutanota.ctrl.TagListViewModel,
        mailListViewModel: tutao.tutanota.ctrl.MailListViewModel,
        mailViewModel: tutao.tutanota.ctrl.MailViewModel,
        passwordChannelViewModel: tutao.tutanota.ctrl.PasswordChannelViewModel,
        contactListViewModel: tutao.tutanota.ctrl.ContactListViewModel,
        contactViewModel: tutao.tutanota.ctrl.ContactViewModel,
        feedbackViewModel: tutao.tutanota.ctrl.FeedbackViewModel,
        fontViewModel: tutao.tutanota.ctrl.FontViewModel,
        themeViewModel: tutao.tutanota.ctrl.ThemeViewModel,
        loginView: tutao.tutanota.gui.LoginView,
        externalLoginView: tutao.tutanota.gui.ExternalLoginView,
        notFoundView: tutao.tutanota.gui.LoginView,
        mailView: tutao.tutanota.gui.MailView,
        contactView: tutao.tutanota.gui.ContactView,
        fastMessageView: tutao.tutanota.gui.FastMessageView,
        notSupportedView: tutao.tutanota.gui.NotSupportedView,
        registrationVerifyDomainView: tutao.tutanota.gui.RegistrationVerifyDomainView,
        registrationVerifyDomainViewModel: tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel,
        registrationView: tutao.tutanota.gui.RegistrationView,
        registrationViewModel: tutao.tutanota.ctrl.RegistrationViewModel,
        logView: tutao.tutanota.gui.LogView,
        logViewModel: tutao.tutanota.ctrl.LogViewModel,
        dbView: tutao.tutanota.gui.DbView,
        dbViewModel: tutao.tutanota.ctrl.DbViewModel,
        monitorView: tutao.tutanota.gui.MonitorView,
        monitorViewModel: tutao.tutanota.ctrl.MonitorViewModel,
        configView: tutao.tutanota.gui.ConfigView,
        configViewModel: tutao.tutanota.ctrl.ConfigViewModel,
        customerView: tutao.tutanota.gui.CustomerView,
        customerViewModel: tutao.tutanota.ctrl.CustomerViewModel,
        settingsView: tutao.tutanota.gui.SettingsView,
        settingsViewModel: tutao.tutanota.ctrl.SettingsViewModel,
        entropyCollector: tutao.crypto.EntropyCollector,
        htmlSanitizer: tutao.tutanota.security.CajaSanitizer,
        languageViewModel: tutao.tutanota.ctrl.LanguageViewModel,
        eventBus: tutao.event.EventBusClient,
        fileViewModel: tutao.tutanota.ctrl.FileViewModel,
        fileView: tutao.tutanota.gui.FileView,
        navigator: tutao.tutanota.ctrl.Navigator,
        legacyDownloadViewModel: tutao.tutanota.ctrl.LegacyDownloadViewModel,
        progressDialogModel: tutao.tutanota.ctrl.ProgressDialogModel,
        modalPageBackgroundViewModel: tutao.tutanota.ctrl.ModalPageBackgroundViewModel
    };

    if (tutao.tutanota.util.ClientDetector.isMobileDevice()) {
        singletons['swipeRecognizer'] = tutao.tutanota.ctrl.SwipeRecognizer;
    }
    tutao.tutanota.legacy.Legacy.setup(singletons);

    // @type {tutao.Locator}
    tutao.locator = new tutao.Locator(singletons);

    // shortcuts
    tutao.lang = tutao.locator.languageViewModel.get;

    if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE) {
        var viewport = document.querySelector("meta[name=viewport]");
        //viewport.setAttribute('content', 'initial-scale=0.85, maximum-scale=0.85, user-scalable=no');
    }

	// indexing is disabled currently
   // if (!tutao.locator.dao.isSupported() || tutao.tutanota.util.ClientDetector.isMobileDevice()) {
        tutao.locator.replace('dao', new tutao.db.DummyDb);
   // }

    // add a cache to the rest entity chain
    var cache = new tutao.rest.EntityRestCache();
    cache.setTarget(tutao.locator.entityRestClient);
    tutao.locator.replace('entityRestClient', cache);

    if (tutao.locator.swipeRecognizer) {
        tutao.locator.swipeRecognizer.setScreenSize(tutao.tutanota.gui.getWindowWidth(), tutao.tutanota.gui.getWindowHeight());
        tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT, function () {
            tutao.locator.viewManager.getActiveView().getSwipeSlider().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT);
        });
        tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT, function () {
            tutao.locator.viewManager.getActiveView().getSwipeSlider().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT);
        });
    }

    tutao.tutanota.gui.initEvents();

    var external = tutao.util.StringUtils.startsWith(location.hash, "#mail");
    tutao.locator.viewManager.init([tutao.locator.registrationView, tutao.locator.loginView, tutao.locator.mailView, tutao.locator.contactView, tutao.locator.fileView, tutao.locator.externalLoginView, tutao.locator.notSupportedView, tutao.locator.logView, tutao.locator.dbView, tutao.locator.monitorView, tutao.locator.configView, tutao.locator.settingsView, tutao.locator.customerView, tutao.locator.registrationVerifyDomainView], external);

    tutao.tutanota.gui.addWindowResizeListener(function (width, height) {
        // notify the active view and the swipe recognizer
        if (tutao.locator.viewManager.getActiveView() != null) {
            tutao.locator.viewManager.getActiveView().getSwipeSlider().windowSizeChanged(width, height);
        }
        if (tutao.locator.swipeRecognizer) {
            tutao.locator.swipeRecognizer.setScreenSize(width, height);
        }
    });
};

/* html code for file menu icon
 <li>
 <div class="menu_link" data-bind="fastClick: function(data, event) { setTimeout(function() { select(tutao.locator.fileView); }, 0); }">
 <!-- ko if: getActiveView() == tutao.locator.fileView -->
 <div class="menu_image"><div class="file-new" data-bind="attr: {title: tutao.lang('newFolder_alt')}"></div></div>
 <div class="menu_text" data-bind="lang: 'new_label'"></div>
 <!-- /ko -->
 <!-- ko ifnot: getActiveView() == tutao.locator.fileView -->
 <div class="menu_image"><div class="file" data-bind="attr: {title: tutao.lang('files_alt')}"></div></div>
 <div class="menu_text" data-bind="lang: 'files_label'"></div>
 <!-- /ko -->
 </div>
 </li>*/
