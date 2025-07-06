unknown = неизвестная команда
action-canceled = ℹ️ | действие отменено
render-skin-updated = ℹ️ | скин для рендера обновлен!
too-large-skin-file = ℹ️ | Файл слишком большой! Скачайте его <a href="https://dl.issou.best/ordr/skins/{ $skin_id }.osk">по ссылке</a>
skin-choose-title = Выберите скин, нажав на кнопку ниже.
skin-choose = Выбрать скин
cancel = Отмена

oki-supporter-alerady-has = Упс! Кажется у вас уже есть oki!supporter. Мы вернули вам ваши звезды, если хотите задонатить еще, то пожалуйста возпользуйтесь методами описанными <a href="https://t.me/donatenyako">тут</a>
oki-supporter-buyed = <i>Спасибо за поддержку <b>Oki-Chan</b>!</i> \nВам успешно выдан oki!supporter. \n\nЕсли вы перевели средства по ошибке, то можете запросить рефанд у @Anaka3. \nДля этого вам необходим id платежа: <pre>{ $payment_id }</pre>
oki-supporter-error-dm = ❌ | оплатить oki!supporter можно только в лс бота.
oki-supporter-want-to-continue = Вы уверены что хотите продолжить?
oki-supporter-crypto-inhour = Оплатите счет ниже в течении часа

user = 🔗 | юзер
diff = 🔗 | диффа

yes = Да
no = Нет

add-to-group = ➕ | добавить в свою группу
welcome-message-group = привет! буду скидывать в эту группу некоторую информацию про osu!
welcome-message = привет! я полезный бот для игроков osu!
help-text = <i>доступные команды:</i>\n\nпрефикс - <b>osu!/o!</b> | пример osu!help/o!help\n\n<b>osu!help</b> - это сообщение\n<b>osu!get</b> - карточка пользователя (команда отправляется в ответ на сообщение, чью карточку генерируем)\n<b>osu!user</b> [имя пользователя] - карточка юзера. тоже самое при отправке ссылки на профиль osu!\n<b>osu!me</b> - о вас\n<b>osu!last/best</b> - последний/лучший рекорд (команда также отправляется в ответ на сообщение)\n<b>osu!link</b> - привязать аккаунт osu\!\n<b>osu!settings</b> - настройки\n<b>osu!random</b><i>(rnd)</i> - рандомная ранкнутая карта\n<b>osu!db</b> - просмотр бейджей\n\nпри отправке .osr файла генерируется видео реплея\nпри отправке ссылки на битмап генерируется карточка битмапа

sip-not-found = ❌ | у этого пользователя нет турнирной статистики =(\nможет ему стоит сходить на турнир?
sip-rank-global = Ранк(глобал)
sip-tournament-stats-title = турнирная статистика юзера
sip-tournament-stats-global = Глобальная
sip-supporter-required = ❌ | у вас нет оки!саппортера, для того чтобы посмотреть турнирую статистику\nhttps://t.me/okisupporter

audio-requested = Запрошено: <b><a href="tg://user?id={ $userId }">{ $username }</b>
help = ❓ | помощь
link-button = ➕ | привязать osu
link-required = ❌ | вам необходимо привязать аккаунт\nиcпользуйте osu!link
link-required-with-name = ❌ | аккаунт { $account } не привязан.\nпривяжите его командой osu!link
link-title = привязать аккаунт
alerady-linked = ❌ | аккаунт уже привязан
not-linked = ❌ | аккаунт не привязан
successfuly-linked = ➕ | ваш osu! профиль привязан
successfuly-relinked = ➕ | ваш osu! профиль перепривязан
link-error-dm = 🤓 | простите сэр, но авторизация доступна только в личных сообщениях с ботом.

tournaments-error-region = ❌ | регистрация в этом регионе недоступна
tournaments-error-alerady-linked = ❌ | вы уже зарегистрировались на турнир
tournaments-registered = ✅ Вы успешно зарегистрировались на { $tournament_name }
tournaments-register-unable = ❌ | регистрация больше недоступна
tournaments-register = Зарегистрироваться
tournaments-register-title = Регистрация на турнир\n\nУсловия:{ $conditions }

replays-account-link-needed = ❌ | Для рендера вам необходимо пройти процесс привязки к osu!
replays-send-only-one-file = ❌ | Отправьте только один файл, пожалуйста
replays-cooldown-message =
    { $mins ->
        [one] ❌ | Вам необходимо подождать { $mins } минуту перед генерацией следующего видео.
        [few] ❌ | Вам необходимо подождать { $mins } минуты перед генерацией следующего видео.
       *[other] ❌ | Вам необходимо подождать { $mins } минут перед генерацией следующего видео.
    }

replays-20-star-maps-err = 20+ стар карты не рендерятся
replays-std-err = ❌ | реплей не osu!std
replays-bad-file-err = ❌ | отправленный реплей поломан, попробуйте переэкспортировать его
replays-beatmap-not-found = ❌ | битмапа нет на сайте osu! (возможно это неподтвержденная карта или кастомная сложность)
replays-audio-unable-err = ❌ | аудио недоступно
replays-autoplay-err = ❌ | автоплей мод не рендерится
replays-bad-name-err = ❌ | в имени реплея содержатся знаки ломающие рендер
replays-other-err = ❌ | произошла ошибка
replays-working-with-file = файл в работе
replays-rendering = *рендерим*
replays-tg-upload = *загружаю в телеграм*
replays-video-too-large = видео слишком большое
replays-open-it-here = откройте его здесь
replays-beatmapset = битмапсет
replays-author = автор реплея

use-without-reply = ❌ | изпользуйте { $command } без ответа
scores-not-found = { $type ->
   [last] последних скоров не найдено
   [best] скоров не найдено
  *[other] скоров не найдено
}

settings = Настройки
settings-page1-title = Выберете настройку\nТекущий скин (id) рендера: <code>{ $skin }</code>\nстраница: 1/2
settings-page2-title = Выберете настройку\nстраница: 2/2
setting-page2 = Страница 2 →
setting-page1 = ← Страница 1
setting-skin = Скин
setting-video = Видео
setting-paralax = Параллакс
setting-skip-intro = Пропуск интро
setting-ppcounter = Показывать счетчик pp
setting-ignorefail = 
setting-storyboard =
setting-results-screen = 
setting-choosemenu-title = { $currentParam ->
   [enabled] настройте параметр\nТекущее состояние: Включено
   [disabled] настройте параметр\nТекущее состояние: Выключено
}
setting-choosemenu-enable = Включить
setting-choosemenu-disable = Выключить

setting-donator-skins = Донаторские скины
setting-donator-skins-enter-skinid = Введите id скина:
setting-donator-skins-enter-skinid-set = Успешно установлен id: <i>{ $skinId }</i>!
setting-donator-skins-enter-skinid-error = ❌ | Не удалось установить скин. Вероятно его не существует!

user-not-found = ❌ | Игроков с id <code>{ $userId }</code> не найдено
user-donated = Этот пользователь поддержал бота. Спасибо!
user-now-tracking = ваша учетная запись теперь отслеживается на osutrack

map-audio-preview = 🎧 | слушать превью
map-mapper-profile = 🌠 | профиль маппера
