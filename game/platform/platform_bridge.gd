class_name PlatformBridge
extends Node

enum Host { LOCAL, TELEGRAM, DISCORD }

var host := Host.LOCAL
var initialized := false

func detect_host() -> Host:
	if not OS.has_feature("web"):
		host = Host.LOCAL
		return host

	var telegram := _eval_bool("typeof window !== 'undefined' && !!window.Telegram && !!window.Telegram.WebApp")
	if telegram:
		host = Host.TELEGRAM
		return host

	var discord := _eval_bool("typeof window !== 'undefined' && !!window.__BASEBALL_WAIFUS_DISCORD_READY__")
	if discord:
		host = Host.DISCORD
		return host

	host = Host.LOCAL
	return host

func initialize() -> void:
	host = detect_host()
	initialized = true
	if host == Host.TELEGRAM or host == Host.DISCORD:
		_js("window.BaseballWaifusHost && window.BaseballWaifusHost.ready && window.BaseballWaifusHost.ready();")

func set_fullscreen() -> void:
	match host:
		Host.TELEGRAM:
			_js("window.BaseballWaifusHost && window.BaseballWaifusHost.expand && window.BaseballWaifusHost.expand();")
		Host.DISCORD:
			_js("window.BaseballWaifusHost && window.BaseballWaifusHost.fullscreen && window.BaseballWaifusHost.fullscreen();")
		_:
			pass

func haptic_light() -> void:
	match host:
		Host.TELEGRAM, Host.DISCORD:
			_js("window.BaseballWaifusHost && window.BaseballWaifusHost.haptic && window.BaseballWaifusHost.haptic('light');")
		_:
			if OS.has_feature("mobile"):
				Input.vibrate_handheld(15)

func host_name() -> String:
	match host:
		Host.TELEGRAM:
			return "Telegram Mini App"
		Host.DISCORD:
			return "Discord Activity"
		_:
			return "Local"

func _eval_bool(expression: String) -> bool:
	if not OS.has_feature("web"):
		return false
	return bool(JavaScriptBridge.eval(expression))

func _js(code: String) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval(code)
