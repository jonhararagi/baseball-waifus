class_name PlatformBridge
extends Node

enum Host { LOCAL, TELEGRAM, DISCORD }

var host := Host.LOCAL
var initialized := false

func detect_host() -> Host:
	if not OS.has_feature("web"):
		host = Host.LOCAL
		return host

	var query_host := str(JavaScriptBridge.eval("(new URLSearchParams(window.location.search)).get('platform') || ''"))
	if query_host == "telegram":
		host = Host.TELEGRAM
		return host
	if query_host == "discord":
		host = Host.DISCORD
		return host

	var telegram := _eval_bool("typeof window !== 'undefined' && !!window.Telegram && !!window.Telegram.WebApp")
	if telegram:
		host = Host.TELEGRAM
		return host

	host = Host.LOCAL
	return host

func initialize() -> void:
	host = detect_host()
	initialized = true
	if host == Host.TELEGRAM or host == Host.DISCORD:
		_js("window.parent !== window && window.parent.BaseballWaifusHost ? window.parent.BaseballWaifusHost.ready() : (window.BaseballWaifusHost && window.BaseballWaifusHost.ready ? window.BaseballWaifusHost.ready() : null);")

func set_fullscreen() -> void:
	match host:
		Host.TELEGRAM:
			_js("window.parent !== window && window.parent.BaseballWaifusHost ? window.parent.BaseballWaifusHost.expand() : null;")
		Host.DISCORD:
			_js("window.parent !== window && window.parent.BaseballWaifusHost ? window.parent.BaseballWaifusHost.fullscreen() : null;")
		_:
			pass

func haptic_light() -> void:
	match host:
		Host.TELEGRAM, Host.DISCORD:
			_js("window.parent !== window && window.parent.BaseballWaifusHost ? window.parent.BaseballWaifusHost.haptic('light') : null;")
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
